# Fases del Proyecto — Plataforma Freelance (Web + Supabase)

**Stack:** React + TypeScript + Vite + Tailwind (web) · Supabase (backend/DB/Auth/Storage/Edge Functions)
**Alcance de este documento:** solo la parte web + Supabase. La app Flutter se construye en paralelo por otra persona, como esqueleto sin conexión real, y se conecta más adelante contra este mismo backend.
**Diferenciador del producto:** sistema de pago seguro (escrow) — el pago del cliente queda retenido por la plataforma hasta que se confirma la entrega, con mediación humana en caso de disputa.
**Público objetivo:** estudiantes recién egresados o cursando carrera que ofrecen servicios freelance, abierto también a cualquier persona.
**Nota sobre diseño:** dado que el tiempo es limitado, no se deja todo el diseño para el final. Cada fase termina con un paso de **diseño mínimo** — un pase visual liviano (espaciado, tipografía, colores base de Tailwind) solo de lo construido en esa fase, sin pulido exhaustivo. El pulido final de identidad visual queda para la Fase 10.

---

## Fase 0 — Cimientos del Proyecto

El objetivo de esta fase es que el proyecto quede preparado para escalar a una futura app (Flutter) sin duplicar lógica de negocio, aunque hoy solo exista la web.

- Inicializar monorepo (`pnpm workspaces` + Turborepo).
- Estructura de carpetas separando UI de lógica de negocio:
  ```
  apps/
    web/              → solo UI y routing (React + Vite)
  packages/
    core/             → lógica de negocio pura: reglas de escrow, validaciones, cálculo de comisiones
    api/              → capa de acceso a Supabase (queries, mutations) — sin nada de UI
    types/             → tipos generados desde Supabase CLI + tipos de dominio
    ui/                → componentes visuales reutilizables
    supabase/          → migraciones, config, edge functions
  ```
- Crear proyecto en Supabase, configurar `packages/supabase/config.toml`.
- Definir esquema inicial de base de datos: `users`, `profiles`, `roles` (migración `20260201_initial_schema.sql`).
- Configurar Row Level Security (RLS) base desde el inicio — cada usuario solo ve/edita lo que le corresponde según su rol (cliente / freelancer / admin / soporte).
- Generar `packages/types/database.types.ts` desde Supabase CLI.
- Documentar el schema en un archivo compartido (ERD o resumen legible) para que quien construya el esqueleto de Flutter pueda diseñar sus modelos Dart sin necesidad de conexión real todavía.
- **Diseño mínimo:** configurar Tailwind con una paleta base provisional (2-3 colores) y tipografía por defecto, para no arrancar con estilos por defecto del navegador.

**Entregable:** repo funcional, conectado a Supabase, con arquitectura por capas lista para que una futura app consuma `core`/`api`/`types` sin reescribir lógica de negocio.

---

## Fase 1 — Autenticación, Roles y Perfiles

- `apps/web/features/auth`: registro, login, recuperación de contraseña.
- Definir los dos roles principales desde el inicio: **cliente** y **freelancer** (una misma cuenta puede tener ambos roles, es común en este tipo de plataforma).
- `features/profile`: `ProfileForm`, `PortfolioSection`, `SkillsTags` — perfil de freelancer con habilidades, portafolio, tarifas; perfil de cliente más simple.
- `shared/guards/RoleGuard` — control de acceso por rol (cliente / freelancer / admin / soporte). En particular, la ruta del **panel de freelancer** (Fase 2) queda bloqueada para cualquier usuario que no tenga el rol freelancer activado en su cuenta, aunque esté logueado como cliente.
- `shared/lib/supabaseClient.ts`.
- Verificación de identidad básica (email, opcionalmente teléfono) — importante en una plataforma que maneja pagos.
- **Diseño mínimo:** formularios de auth y perfil con layout ordenado (inputs, botones, estados de error) usando los componentes base de `packages/ui`.

**Entregable:** un usuario puede registrarse, elegir/activar su(s) rol(es), completar su perfil y loguearse de forma segura.

---

## Fase 2 — Home, Navegación, Marketplace y Panel de Freelancer

- Migración `20260202_services_tables.sql`: `services`, `categories`, `service_packages` (si se ofrecen niveles tipo básico/estándar/premium).
- **Home (landing pública):** `features/home` — hero con buscador principal, categorías destacadas como accesos rápidos, sección de servicios destacados/recientes. Sirve como puerta de entrada tanto para clientes que buscan contratar como para freelancers que quieren publicarse (similar al patrón "I want to hire / I want to work" de Upwork).
- **Barra de navegación global:** `shared/components/Navbar` — logo, menú desplegable de **categorías** (al pasar el mouse o hacer clic despliega la lista, cada opción navega a `CategoryPage`), enlace a "Publicar servicio" (solo visible con rol freelancer activo), acceso a mensajes/notificaciones, y menú de cuenta.
- **Página de categoría:** `features/categories/CategoryPage` — al elegir una categoría del menú desplegable, muestra el listado completo de freelancers/servicios publicados en esa categoría, reutilizando `FilterPanel` de búsqueda.
- `features/services`: `ServiceForm` (crear/editar servicio), `ServiceCard`, `ServiceDetail`.
- `features/search`: `SearchBar`, `FilterPanel` (categoría, precio, rating, tiempo de entrega).
- **Panel de freelancer (dashboard):** `features/freelancer-panel` — ruta protegida por `RoleGuard`, accesible solo si la cuenta tiene el rol freelancer activo. Incluye: servicios propios publicados, órdenes recibidas (con su estado), resumen de ganancias/pagos retenidos. Es el punto central desde donde el freelancer gestiona su actividad en la plataforma.
- `hooks/useServices.ts`, `useCategories.ts`.
- `servicesService.ts` en `packages/api`: CRUD de servicios, búsqueda, filtros.
- **Diseño mínimo:** Home con jerarquía visual clara (hero, buscador, categorías), Navbar funcional con el desplegable de categorías, y grilla de tarjetas de servicio (`ServiceCard`) presentable con imagen/placeholder, precio y CTA claros.

**Entregable:** un visitante llega al Home y puede elegir si quiere contratar o publicarse; navega categorías desde el menú desplegable hasta ver los freelancers de esa categoría; un freelancer registrado accede a su panel exclusivo para gestionar sus servicios y órdenes.

---

## Fase 3 — Contratación y Acuerdos

Esta fase modela el momento en que cliente y freelancer se ponen de acuerdo, antes de que exista dinero de por medio.

- Migración `20260203_orders_tables.sql`: `orders`, `order_requirements`, `order_status_history`.
- `features/orders`: `OrderRequestForm` (cliente solicita servicio), `OrderDetail`, `RequirementsChecklist`.
- Estados del pedido: `pendiente_acuerdo → acordado → esperando_pago → en_progreso → entregado → aprobado / en_disputa → cerrado`.
- `hooks/useOrders.ts`, `ordersService.ts`.
- Aquí se define el botón/acción clave: **"Activar pago"**, que el freelancer habilita una vez que ambos están de acuerdo en alcance y precio — solo entonces el cliente puede pagar.
- **Diseño mínimo:** indicador visual claro del estado de la orden (badge/timeline simple) para que ambas partes sepan en qué paso están.

**Entregable:** cliente y freelancer pueden negociar el alcance de un trabajo y dejarlo formalmente acordado dentro de la plataforma, listo para pasar a pago.

---

## Fase 4 — Pagos y Escrow (simulado por ahora)

La pieza más delicada del sistema. Toda la lógica de retención/liberación vive en Edge Functions o funciones de Postgres — nunca en el cliente — para que sea una sola fuente de verdad. **La pasarela de pago real todavía no está definida**, así que esta fase se implementa con pagos simulados: no se mueve dinero real, solo se refleja el flujo completo de estados para efectos de demo. El schema se diseña ya pensando en la integración real futura, para no tener que migrar tablas después.

- Migración `20260204_payments_escrow.sql`: `payments`, `escrow_holds`, `payouts`, `platform_fees` — con campos como `payment_provider` y `provider_transaction_id` que por ahora quedan en `"simulado"` / `null`.
- Edge Function `create-payment-intent` (versión simulada): marca la orden como `pago_retenido` y crea el registro en `escrow_holds` sin procesar pago real.
- Edge Function `release-payment` (versión simulada): libera el "pago" al freelancer cambiando estados, sin transferencia real de dinero.
- Edge Function `partial-release-payment`: libera un porcentaje definido por soporte en caso de entrega parcial (también simulado).
- `features/payments`: `PaymentButton`, `EscrowStatusBadge`, `PayoutHistory`.
- Cálculo y "retención" de la comisión de la plataforma antes del payout simulado al freelancer.
- Dejar comentado/documentado en el código el punto exacto donde se conectará la pasarela real (Stripe Connect u otra) más adelante.
- **Diseño mínimo:** que el estado de "pago retenido" / "pago liberado" se vea claramente distinto (colores, íconos) aunque el dinero no sea real — es importante para que la demo transmita bien la idea del producto.

**Entregable:** el flujo completo de pago seguro funciona de punta a punta de forma simulada — pago retenido, aprobación del cliente, liberación al freelancer, comisión descontada — listo para conectar una pasarela real sin rehacer el schema ni la UI.

---

## Fase 5 — Disputas y Mediación

- Migración `20260205_disputes_tables.sql`: `disputes`, `dispute_messages`, `dispute_resolutions`.
- `features/disputes`: `DisputeForm` (freelancer abre disputa si el cliente no libera el pago), `DisputeThread`, `EvidenceUpload`.
- Flujo: freelancer marca la orden como "entregada" → si el cliente no aprueba ni objeta en un plazo definido, se puede escalar a disputa → un mediador de soporte revisa evidencia (chat, archivos entregados, requerimientos originales) y decide.
- Tres resoluciones posibles ya definidas por vos: **no liberar** (trabajo mal hecho), **liberar completo** (trabajo bien hecho pese a objeción sin fundamento), **liberar parcial** (entrega a medias).
- `disputesService.ts`, `hooks/useDisputes.ts`.
- **Diseño mínimo:** hilo de disputa legible (tipo chat/timeline) que distinga claramente mensajes de cliente, freelancer y soporte.

**Entregable:** cualquier conflicto de pago tiene un camino claro de resolución mediado por un humano de soporte, con las tres decisiones posibles ya soportadas por el sistema de pagos de la Fase 4.

---

## Fase 6 — Reputación y Reseñas

- Migración `20260206_reviews_tables.sql`: `reviews`, `ratings`.
- `features/reviews`: `ReviewForm`, `RatingStars`, `ReviewsList` en el perfil del freelancer.
- Reseña solo habilitada tras orden cerrada (aprobada o resuelta por disputa).
- `reviewsService.ts`.
- **Diseño mínimo:** estrellas de rating y lista de reseñas con buena legibilidad dentro del perfil del freelancer.

**Entregable:** los perfiles de freelancer muestran historial de calificaciones reales, generando confianza para nuevos clientes.

---

## Fase 7 — Mensajería

- Migración `20260207_messaging_tables.sql`: `conversations`, `messages`.
- `features/messaging`: `ChatWindow`, `ConversationList`, adjuntar archivos.
- Uso de Supabase Realtime para mensajes en vivo.
- Vinculación de conversación a una orden específica (contexto claro de qué se está negociando o discutiendo).
- **Diseño mínimo:** burbujas de chat diferenciadas por emisor, con scroll y estado de "escribiendo" opcional.

**Entregable:** cliente y freelancer pueden comunicarse dentro de la plataforma sin salir a WhatsApp/email, dejando registro útil para eventuales disputas.

---

## Fase 8 — Notificaciones

- `features/notifications`: campanita en la web, notificaciones por email (Edge Function `send-notification-email`).
- Eventos clave a notificar: nueva propuesta, pago activado, entrega realizada, pago liberado, disputa abierta/resuelta.
- Tabla `notifications` con estado leído/no leído.
- **Diseño mínimo:** dropdown de notificaciones con distinción visual entre leídas/no leídas.

**Entregable:** ambas partes se enteran en tiempo real de los eventos importantes del flujo, sin tener que estar revisando la plataforma constantemente.

---

## Fase 9 — Panel de Soporte / Backoffice

Panel exclusivo para el equipo de la plataforma (no clientes ni freelancers).

- `apps/web/features/admin` (o sub-ruta protegida): `DisputesQueue`, `UserManagement`, `PaymentsOverview`.
- `shared/guards/SupportGuard.tsx` / `SuperAdminGuard.tsx`.
- Vista de métricas globales: usuarios activos, órdenes en curso, disputas abiertas, volumen de pagos retenidos (simulados).
- Herramienta de mediación: ver toda la evidencia de una orden en disputa (requerimientos, chat, archivos) desde un solo lugar antes de decidir.
- **Diseño mínimo:** tablas de datos ordenadas y legibles (usuarios, órdenes, disputas), sin necesidad de gráficos elaborados todavía.

**Entregable:** el equipo puede gestionar disputas, usuarios y pagos desde un panel central, sin acceso directo a la base de datos.

---

## Fase 10 — Pulido Final de Diseño e Identidad Visual

Como cada fase ya incluyó su diseño mínimo, esta fase ya no es "diseñar desde cero" sino dar consistencia y pulir lo ya construido.

- Definir identidad visual definitiva (colores, tipografía, tono de marca) — enfocado en transmitir confianza, dado que el producto maneja dinero de terceros (aunque sea simulado).
- Unificar `packages/ui` (Button, Modal, Table, Badge, StatusPill) bajo el sistema visual definitivo, reemplazando la paleta provisional de la Fase 0.
- Pulir flujos críticos: publicar servicio, activar pago, aprobar entrega, abrir disputa — estos son los momentos de mayor fricción/ansiedad del usuario y deben ser muy claros.
- Responsive y accesibilidad.

**Entregable:** el producto se ve y se siente confiable y coherente en toda la plataforma, no solo funciona.

---

## Fase 11 — QA, Seguridad y Pre-Lanzamiento

- Auditoría completa de políticas RLS — probar activamente que ningún usuario accede a datos u órdenes ajenas.
- Pruebas exhaustivas del flujo de pagos simulado: casos límite de liberación parcial, reintentos, dobles clics en "liberar pago".
- Revisión de manejo de errores y estados vacíos en toda la app.
- Checklist de seguridad: variables de entorno, claves de Supabase protegidas.
- Documentación interna (`README.md` del monorepo, guía de arquitectura para quien construya la app Flutter más adelante, y nota clara de qué queda simulado vs. real).

**Entregable:** producto listo para demo o para conectar la pasarela de pago real cuando se decida.

---

## Fase 12 — Lanzamiento / Presentación

- Definir si esta fase es una presentación/demo (dado el objetivo actual de "mostrar el proyecto") o un lanzamiento real más adelante.
- Si es demo: preparar datos de ejemplo (servicios, órdenes, disputas) que muestren bien el flujo de escrow simulado.
- Si es lanzamiento real: activar cobros reales vía la pasarela de pago elegida en ese momento.
- Monitoreo post-lanzamiento (errores, uso, feedback) si aplica.

---

### Pendientes que quedaron abiertos para definir juntos más adelante
- Pasarela de pago real a integrar cuando corresponda (Stripe Connect u otra que soporte retención de fondos en tu región).
- Porcentaje de comisión de la plataforma.
- Plazo automático antes de poder escalar a disputa si el cliente no responde.
- Identidad visual definitiva (Fase 10).
- Si la Fase 12 es demo o lanzamiento real.
