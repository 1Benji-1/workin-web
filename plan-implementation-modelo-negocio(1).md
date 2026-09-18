# Plan de Implementación — Nuevo Modelo de Precios y Comisión

## 0. Resumen del objetivo

Reemplazar el modelo actual de **precio fijo + comisión descontada al freelancer**, por un modelo de **precio negociado + comisión cobrada al cliente**:

1. El servicio publicado ya no tiene un precio fijo: muestra **"Desde Bs X"** (precio orientativo).
2. Cliente y freelancer negocian el alcance (vía chat del proyecto, ya existente).
3. El freelancer, cuando está listo para activar el pago, define el **precio final que quiere cobrar** en un campo editable.
4. Al lado, en vivo, se calcula el **total que pagará el cliente** = precio del freelancer + 12% de comisión de plataforma.
5. El freelancer recibe el **100%** de lo que pidió; la comisión la asume el cliente, encima del precio.
6. Toda la plataforma pasa a manejar **Bolivianos (BOB)** como moneda oficial.
7. Se eliminan los **paquetes de servicio** (básico/estándar/premium) de este modelo.
8. El campo de "Presupuesto Acordado" que hoy llena el cliente al pedir el servicio **se elimina**.

## 1. Cómo funciona hoy (para dimensionar el cambio)

- `services.price`: precio fijo fijado por el freelancer al publicar.
- `service_packages`: 3 niveles con precio fijo cada uno.
- `OrderRequestPage.tsx`: el **cliente** propone un `price` ("Presupuesto Acordado") al crear la orden. Esto se guarda directo en `orders.price`.
- `OrderDetailPage.tsx`: el freelancer solo confirma con el botón **"Activar Pago"** (`canFreelancerActivatePayment`) — no toca el precio, ya viene fijado por el cliente desde el paso anterior.
- `process_simulated_escrow_payment()` (función SQL): calcula `platform_fee = order.price * 0.10` y `net_amount = order.price - platform_fee`. Es decir, **hoy la comisión (10%) se descuenta de lo que recibe el freelancer**, y el cliente paga exactamente `order.price`.
- Moneda: todo en USD (`$`), vía `formatCurrency()` en `@freelance/core` (`Intl.NumberFormat("es-US", { currency: "USD" })`).

## 2. Cómo va a funcionar (modelo nuevo)

- `services.price` cambia de significado a **"precio desde"** (orientativo, sin validación cruzada con el precio final real).
- Se elimina `service_packages` del flujo (ver sección 6 sobre qué hacer con la tabla).
- `OrderRequestPage.tsx`: el cliente **ya no propone precio**. Solo título, descripción, requerimientos y días de entrega. La orden se crea sin precio (`pendiente_acuerdo`, `price = null`).
- `OrderDetailPage.tsx`: el botón **"Activar Pago"** se reemplaza por un flujo de 2 pasos:
  1. Botón "💰 Definir precio final y activar pago" (visible solo para el freelancer, mismas condiciones que hoy usa `canFreelancerActivatePayment`).
  2. Al hacer clic, se despliega:
     - Un campo editable: **"Tu precio (Bs)"**.
     - Al lado, un campo de solo lectura que se actualiza **en vivo** mientras el freelancer escribe: **"Total que pagará el cliente: Bs X (incluye 12% de comisión de plataforma)"**.
     - Botón de confirmación: "Activar pago con este precio".
- Al confirmar: se guarda el precio del freelancer, se calcula y guarda la comisión, se guarda el total, la orden pasa a `esperando_pago`, y desde ahí sigue el flujo actual sin cambios (cliente deposita en Escrow, freelancer entrega, cliente aprueba, se liberan fondos).
- El freelancer recibe el **100%** de lo que escribió en "Tu precio". La comisión (12%) queda registrada como ingreso de la plataforma, tal como hoy, solo que ahora es un monto **adicional** y no un descuento.
- Mínimo técnico de validación: **Bs 20** (solo para evitar Bs 0 o valores inválidos, no está atado al "Desde" publicado en el servicio — el freelancer tiene libertad total).

## 3. Cambios en base de datos (Supabase / SQL)

### 3.1 Nueva migración: `orders` — separar precio del freelancer, comisión y total

```sql
-- supabase/migrations/<timestamp>_pricing_model_v2.sql

-- 1. La orden ya no nace con precio (lo define el freelancer al activar el pago)
alter table public.orders
  alter column price drop not null;

-- 2. Nuevas columnas para trazabilidad del desglose
alter table public.orders
  add column if not exists freelancer_price numeric(10,2),
  add column if not exists commission_amount numeric(10,2);

comment on column public.orders.price is
  'Total que paga el cliente = freelancer_price + commission_amount. Null hasta que el freelancer activa el pago.';
comment on column public.orders.freelancer_price is
  'Monto que el freelancer decide cobrar (recibe el 100% de este monto).';
comment on column public.orders.commission_amount is
  'Comisión de plataforma (12% de freelancer_price), pagada por el cliente encima del precio.';
```

### 3.2 Función `activate_order_payment` (nueva función SQL, reemplaza el UPDATE directo)

Hoy `activateOrderPayment()` (en `packages/api/src/orders.api.ts`) hace un `UPDATE` directo a la tabla `orders` sin lógica de negocio. Con el nuevo modelo conviene mover el cálculo a una función `SECURITY DEFINER`, siguiendo el mismo patrón ya usado en `process_simulated_escrow_payment`:

```sql
CREATE OR REPLACE FUNCTION public.activate_order_payment(
    p_order_id UUID,
    p_freelancer_price NUMERIC
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_commission NUMERIC(10,2);
    v_total NUMERIC(10,2);
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden % no encontrada.', p_order_id;
    END IF;

    IF v_order.freelancer_id != v_user_id THEN
        RAISE EXCEPTION 'Solo el freelancer de la orden puede activar el pago.';
    END IF;

    IF v_order.status NOT IN ('pendiente_acuerdo', 'acordado') THEN
        RAISE EXCEPTION 'La orden no está en un estado válido para activar el pago (estado actual: %).', v_order.status;
    END IF;

    IF p_freelancer_price < 20 THEN
        RAISE EXCEPTION 'El precio mínimo permitido es Bs 20.';
    END IF;

    v_commission := ROUND(p_freelancer_price * 0.12, 2);
    v_total := p_freelancer_price + v_commission;

    UPDATE public.orders
    SET freelancer_price = p_freelancer_price,
        commission_amount = v_commission,
        price = v_total,
        status = 'esperando_pago',
        agreed_at = now(),
        payment_activated_at = now(),
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_order;

    INSERT INTO public.order_status_history (order_id, previous_status, new_status, changed_by, comment)
    VALUES (p_order_id, 'pendiente_acuerdo', 'esperando_pago', v_user_id,
            'El freelancer definió el precio final (Bs ' || p_freelancer_price || ') y activó la orden para pago');

    RETURN v_order;
END;
$$;
```

### 3.3 `process_simulated_escrow_payment()` — usar el desglose ya calculado (no recalcular 10%)

Cambiar:
```sql
-- ANTES
v_fee := ROUND(v_order.price * 0.10, 2);
v_net := v_order.price - v_fee;
```
Por:
```sql
-- AHORA: el desglose ya se calculó en activate_order_payment()
v_fee := v_order.commission_amount;
v_net := v_order.freelancer_price;
```
Y en el `INSERT INTO public.platform_fees`, cambiar `fee_percentage` de `10.00` a `12.00` (o mejor, `12.00` como nueva constante, o derivarlo de `v_fee / v_net * 100` para que quede exacto).

También actualizar el `DEFAULT` de `platform_fees.fee_percentage` de `10.00` a `12.00` en la definición de tabla (para nuevas filas futuras si se insertan por otro camino).

### 3.4 `service_packages` — no se elimina la tabla, se deja de usar

Para no romper `orders.package_id` (FK existente) ni arriesgar una migración destructiva, se recomienda:
- Dejar la tabla `service_packages` en la base de datos, sin eliminarla.
- Dejar de escribir/leer paquetes desde el frontend (ver sección 4).
- Si más adelante se confirma que no se van a retomar, se puede hacer una migración de limpieza aparte (fuera de este plan).

## 4. Cambios en `packages/core` (lógica de negocio pura)

Archivo: `packages/core/src/index.ts`

- `DEFAULT_PLATFORM_FEE_RATE`: `0.10` → `0.12`.
- `DEFAULT_PLATFORM_FEE_PERCENT`: `10` → `12`.
- `calculatePlatformFee(amount, feePercentage = 0.1)` → default `0.12`. Se usa para mostrar la comisión en el detalle de orden (`OrderDetailPage.tsx`), pero ahora debe calcularse sobre `order.freelancerPrice`, no sobre `order.price` (que ahora es el total). Ver sección 5.
- `calculateEscrowBreakdown()`: mismo cambio de tasa por defecto.
- Nueva función auxiliar sugerida, para que el frontend no reimplemente la fórmula:
  ```ts
  export function calculateClientTotal(freelancerPrice: number, feePercentage = DEFAULT_PLATFORM_FEE_RATE) {
    const commission = Number((freelancerPrice * feePercentage).toFixed(2));
    const total = Number((freelancerPrice + commission).toFixed(2));
    return { freelancerPrice, commission, total, feePercentage: feePercentage * 100 };
  }
  ```
  Esta es la que alimenta el "cuadro en vivo" del lado del freelancer.
- `MIN_FREELANCER_PRICE = 20` (nueva constante, Bs).
- `formatCurrency()`: cambiar de `Intl.NumberFormat("es-US", { currency: "USD" })` a `Intl.NumberFormat("es-BO", { currency: "BOB" })`. Este es un cambio de un solo punto que actualiza automáticamente **todos** los montos mostrados en la app (dashboards, órdenes, pagos, disputas, backoffice), ya que todos usan esta misma función.
- `calculateDisputeSplit()`: revisar (ver sección 7 — Punto pendiente de decisión).

## 5. Cambios en `packages/api`

### `orders.api.ts`

- `createOrder()`: quitar `price` del `insert` (o dejarlo `undefined`/`null` explícitamente). Actualizar `CreateOrderPayload` (en `@freelance/types`) para que `price` sea opcional o se elimine del payload.
- `activateOrderPayment()`: cambiar firma a `activateOrderPayment(supabase, orderId, freelancerPrice)` y que internamente llame al nuevo RPC `activate_order_payment` en vez de hacer un `UPDATE` directo:
  ```ts
  export async function activateOrderPayment(
    supabase: SupabaseClient<Database>,
    orderId: string,
    freelancerPrice: number
  ) {
    return supabase.rpc("activate_order_payment", {
      p_order_id: orderId,
      p_freelancer_price: freelancerPrice,
    });
  }
  ```

### `@freelance/types`

- `CreateOrderPayload`: quitar `price` (o volverlo opcional y sin uso).
- `OrderWithDetails` (y el tipo crudo que mapea `useOrderDetail.ts`): agregar `freelancerPrice: number | null` y `commissionAmount: number | null`.

## 6. Cambios en el frontend (`apps/web`)

### 6.1 `ServiceForm.tsx` (publicación de servicio)

- Renombrar el label del input `price` de "Precio" a **"Precio desde (Bs)"**, con `helperText`: "Es un precio orientativo. El precio final se acuerda con cada cliente antes de activar el pago."
- Eliminar toda la sección de paquetes: estados `includePackages`, `standardTitle`, `standardDesc`, `premiumTitle`, `premiumDesc`, `premiumPrice`, y el bloque de UI correspondiente, junto con las llamadas a `service_packages` en `createService`/`updateService` (revisar `services.api.ts`).

### 6.2 `ServiceCard.tsx` / `ServiceDetail.tsx` (marketplace)

- Cambiar el texto de precio de `formatCurrency(service.price)` a `"Desde " + formatCurrency(service.price)`.
- `ServiceDetail.tsx`: quitar el selector de paquetes (básico/estándar/premium) si existe en esa vista, y el botón de "Solicitar" pasa a apuntar directo a `OrderRequestPage` sin `?tier=`.

### 6.3 `OrderRequestPage.tsx`

- Eliminar el campo `price` del formulario ("Condiciones Económicas y Plazos" pasa a ser solo "Tiempo de Entrega Estimado").
- Eliminar toda la lógica de `selectedPackageId`, `RequestedServicePackage`, y la búsqueda de paquete por `tier` en el `useEffect`.
- El resumen del servicio en la parte superior ya no muestra "Total a acordar: $X" (porque no hay precio todavía) — se puede reemplazar por el texto "Desde {formatCurrency(service.price)}" (como referencia informativa, no vinculante).
- `createOrder()` se llama sin `price`.

### 6.4 `OrderDetailPage.tsx`

- Reemplazar el bloque `canActivate` actual (botón simple "⚡ Activar Pago") por un componente nuevo, ej. `SetFinalPricePanel.tsx`:
  - Estado inicial: botón "💰 Definir precio final y activar pago".
  - Al hacer clic, se expande: `Input` numérico "Tu precio (Bs)" (mínimo `20`) + un `<div>` de solo lectura que muestra en vivo, usando `calculateClientTotal(Number(precio))`:
    - "Comisión de plataforma (12%): Bs X"
    - "Total que pagará el cliente: Bs Y"
  - Botón "Confirmar y activar pago" → llama `activatePayment(precio)` (se actualiza la firma del hook, ver 6.5).
- Ficha "Condiciones del Acuerdo" (columna derecha): una vez la orden ya tiene `freelancerPrice`, mostrar:
  - "Tu precio (freelancer): Bs {order.freelancerPrice}"
  - "Comisión plataforma (12%): Bs {order.commissionAmount}"
  - "Total pagado por el cliente: Bs {order.price}"
  - Si es freelancer: "Tus ganancias: Bs {order.freelancerPrice}" (ya no hay que restar nada, es el monto completo).
- El texto del botón de "Activar Pago" que hoy dice `... depositar los ${order.price} USD ...` deja de tener sentido mostrarse antes de que exista `order.price` — ese mensaje ahora aparece recién dentro del panel nuevo, una vez el freelancer ya escribió su precio.

### 6.5 `useOrderDetail.ts`

- `activatePayment()` pasa a recibir un parámetro: `activatePayment(freelancerPrice: number)`, y lo reenvía a `activateOrderPayment(supabase, order.id, freelancerPrice)`.

### 6.6 Formato de moneda en toda la app

Como `formatCurrency()` centraliza el formato, no hace falta tocar cada pantalla que lo usa (`PayoutHistory.tsx`, `PaymentsOverview.tsx`, `DisputeThread.tsx`, `EscrowStatusBadge.tsx`, `OrdersListPage.tsx`, etc.) — todas heredan el cambio a Bs automáticamente. Sí conviene revisar manualmente los lugares donde el símbolo `$` o el texto "USD" está **hardcodeado** fuera de `formatCurrency()` (por ejemplo, en `OrderDetailPage.tsx` se vieron literales como `${order.price} USD` y `${netEarnings} USD` escritos directo en el JSX en vez de usar `formatCurrency`). Esos hay que cambiarlos a mano.

## 7. Puntos que requieren una decisión (no bloquean el resto del plan)

Estos dos temas no se cubrieron en las preguntas previas porque son casos borde; se puede decidir en el momento de implementar sin afectar el resto del diseño:

1. **Disputas (`calculateDisputeSplit`)**: hoy, si una disputa se resuelve con un % para el freelancer, la función calcula la comisión de plataforma sobre esa porción (`platformFee = freelancerGross * rate`) y se la resta al freelancer. Con el nuevo modelo (donde el freelancer ya recibe el 100% y la comisión la paga el cliente aparte), lo más consistente es que, en una disputa, la comisión **ya cobrada** al cliente (`order.commissionAmount`) no se recalcule ni se le reste al freelancer — el split de disputa debería aplicarse solo sobre `order.freelancerPrice` (lo que hay en juego entre cliente y freelancer), dejando la comisión de plataforma intacta (la plataforma ya prestó el servicio de intermediación). **Recomendación**: `calculateDisputeSplit` recibe `order.freelancerPrice` en vez de `order.price` como `grossAmount`, y se quita el descuento de `platformFee` dentro de esa función (el freelancer conserva el 100% de su porción del split). A confirmar antes de tocar `DisputeThread.tsx`.
2. **Órdenes ya existentes en la base de datos** (si las hay en ambiente de pruebas) con `price` seteado por el cliente bajo el modelo viejo: al correr la migración, esas órdenes quedarán con `freelancer_price = null` y `commission_amount = null`, pero `price` conserva su valor viejo. Si están en `esperando_pago` o más adelante en el flujo, van a mostrar datos inconsistentes en la ficha nueva. Como esto es una app en desarrollo, se asume que se puede limpiar/resetear esas órdenes de prueba manualmente en vez de migrar datos históricos.

## 8. Checklist de implementación (orden sugerido)

1. Migración SQL: `orders.price` nullable + columnas `freelancer_price`, `commission_amount` (sección 3.1).
2. Función SQL `activate_order_payment()` (sección 3.2).
3. Actualizar `process_simulated_escrow_payment()` para usar el desglose ya calculado (sección 3.3).
4. Actualizar `platform_fees.fee_percentage` default a `12.00`.
5. `packages/core`: tasas, `calculateClientTotal()`, `MIN_FREELANCER_PRICE`, `formatCurrency` → BOB (sección 4).
6. `packages/api`: `createOrder()` sin `price`, `activateOrderPayment()` con nueva firma (sección 5).
7. `@freelance/types`: ajustar `CreateOrderPayload` y `OrderWithDetails`.
8. `ServiceForm.tsx`: label "Desde", quitar sección de paquetes.
9. `ServiceCard.tsx` / `ServiceDetail.tsx`: mostrar "Desde Bs X".
10. `OrderRequestPage.tsx`: quitar campo de precio y lógica de paquetes.
11. `OrderDetailPage.tsx` + nuevo `SetFinalPricePanel.tsx`: flujo de precio final en vivo.
12. `useOrderDetail.ts`: `activatePayment(freelancerPrice)`.
13. Revisar literales de `$`/`USD` hardcodeados fuera de `formatCurrency`.
14. Decidir y ajustar `calculateDisputeSplit` (sección 7, punto 1).
15. Pruebas manuales:
    - Publicar servicio → se ve "Desde Bs X" en `ServiceCard`.
    - Solicitar servicio → formulario sin precio, orden creada en `pendiente_acuerdo` con `price = null`.
    - Freelancer abre la orden → ve botón "Definir precio final y activar pago" → escribe `1000` → ve en vivo "Comisión: Bs 120 / Total cliente: Bs 1120" → confirma.
    - Orden pasa a `esperando_pago` con `freelancer_price=1000`, `commission_amount=120`, `price=1120`.
    - Cliente deposita en Escrow → se retiene `Bs 1120`.
    - Cliente aprueba entrega → se liberan `Bs 1000` al freelancer (el 100% de lo que pidió).
    - Probar el mínimo: freelancer intenta poner `Bs 10` → debe rechazarse (mínimo Bs 20).
    - Revisar que todos los montos en la app se muestren en Bs (Bolivianos), no en USD.
