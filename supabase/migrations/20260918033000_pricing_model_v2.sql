-- ==============================================================================
-- FASE: NUEVO MODELO DE PRECIOS Y COMISIÓN (v2)
-- Moneda: Bolivianos (BOB)
-- Comisión: 12% asumida por el cliente sobre el precio del freelancer
-- Precio de orden: definido por el freelancer al activar el pago
-- ==============================================================================

-- 1. La orden ya no nace obligatoriamente con precio (se define al activar pago)
ALTER TABLE public.orders
  ALTER COLUMN price DROP NOT NULL;

-- 2. Columnas para trazabilidad del desglose de precio y comisión
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS freelancer_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2);

COMMENT ON COLUMN public.orders.price IS
  'Total que paga el cliente = freelancer_price + commission_amount. Null hasta que el freelancer activa el pago.';
COMMENT ON COLUMN public.orders.freelancer_price IS
  'Monto que el freelancer decide cobrar (recibe el 100% de este monto).';
COMMENT ON COLUMN public.orders.commission_amount IS
  'Comisión de plataforma (12% de freelancer_price), pagada por el cliente encima del precio.';

-- 3. Actualizar valores por defecto de fee y moneda
ALTER TABLE public.platform_fees
  ALTER COLUMN fee_percentage SET DEFAULT 12.00;

ALTER TABLE public.payments
  ALTER COLUMN currency SET DEFAULT 'BOB';

-- 4. Función atómica para que el Freelancer defina el precio y active el pago
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
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

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
    VALUES (
        p_order_id,
        'pendiente_acuerdo',
        'esperando_pago',
        v_user_id,
        'El freelancer definió el precio final (Bs ' || p_freelancer_price || ') y activó la orden para pago (Comisión 12%: Bs ' || v_commission || ' - Total a pagar por cliente: Bs ' || v_total || ')'
    );

    RETURN v_order;
END;
$$;

-- 5. Actualizar procedimiento de depósito Escrow simulado
CREATE OR REPLACE FUNCTION public.process_simulated_escrow_payment(
    p_order_id UUID,
    p_payment_method TEXT DEFAULT 'tarjeta_simulada'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_payment_id UUID;
    v_escrow_id UUID;
    v_fee NUMERIC(10, 2);
    v_net NUMERIC(10, 2);
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    -- Obtener orden
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden % no encontrada.', p_order_id;
    END IF;

    -- Verificar que quien paga sea el cliente
    IF v_order.client_id != v_user_id THEN
        RAISE EXCEPTION 'Solo el cliente de la orden puede realizar el depósito.';
    END IF;

    -- Verificar estado
    IF v_order.status != 'esperando_pago' THEN
        RAISE EXCEPTION 'La orden no está en estado esperando_pago (estado actual: %).', v_order.status;
    END IF;

    -- Verificar si ya existe retención previa activa
    IF EXISTS (SELECT 1 FROM public.escrow_holds WHERE order_id = p_order_id) THEN
        RAISE EXCEPTION 'Ya existe una retención en custodia para esta orden.';
    END IF;

    -- Desglose del nuevo modelo: comisión guardada en commission_amount y neto en freelancer_price
    v_fee := COALESCE(v_order.commission_amount, ROUND(v_order.price * 0.12, 2));
    v_net := COALESCE(v_order.freelancer_price, v_order.price - v_fee);

    -- 1. Registrar pago simulado en BOB
    INSERT INTO public.payments (
        order_id,
        client_id,
        amount,
        currency,
        status,
        payment_provider,
        provider_transaction_id
    ) VALUES (
        p_order_id,
        v_user_id,
        v_order.price,
        'BOB',
        'held_in_escrow',
        'simulado',
        'sim_tx_' || substr(gen_random_uuid()::text, 1, 16)
    ) RETURNING id INTO v_payment_id;

    -- 2. Registrar retención en Escrow (monto neto = 100% lo pedido por freelancer)
    INSERT INTO public.escrow_holds (
        order_id,
        payment_id,
        amount,
        platform_fee,
        net_amount,
        status
    ) VALUES (
        p_order_id,
        v_payment_id,
        v_order.price,
        v_fee,
        v_net,
        'held'
    ) RETURNING id INTO v_escrow_id;

    -- 3. Registrar comisión de plataforma (12%)
    INSERT INTO public.platform_fees (
        order_id,
        escrow_id,
        fee_percentage,
        fee_amount
    ) VALUES (
        p_order_id,
        v_escrow_id,
        12.00,
        v_fee
    );

    -- 4. Actualizar estado de la orden a 'en_progreso'
    UPDATE public.orders
    SET status = 'en_progreso',
        updated_at = now()
    WHERE id = p_order_id;

    -- 5. Registrar en historial de estados
    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        changed_by,
        comment
    ) VALUES (
        p_order_id,
        'esperando_pago',
        'en_progreso',
        v_user_id,
        'Depósito de Bs ' || v_order.price || ' asegurado en Escrow (' || p_payment_method || '). El freelancer puede iniciar el trabajo.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payment_id', v_payment_id,
        'escrow_id', v_escrow_id,
        'amount', v_order.price,
        'platform_fee', v_fee,
        'net_amount', v_net,
        'status', 'held_in_escrow'
    );
END;
$$;

-- 6. Actualizar procedimiento de liberación de fondos
CREATE OR REPLACE FUNCTION public.release_escrow_payment(
    p_order_id UUID,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_escrow public.escrow_holds%ROWTYPE;
    v_payout_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden % no encontrada.', p_order_id;
    END IF;

    IF v_order.client_id != v_user_id THEN
        RAISE EXCEPTION 'Solo el cliente de la orden puede liberar los fondos.';
    END IF;

    IF v_order.status != 'entregado' THEN
        RAISE EXCEPTION 'La orden debe haber sido entregada antes de liberar fondos (estado actual: %).', v_order.status;
    END IF;

    SELECT * INTO v_escrow
    FROM public.escrow_holds
    WHERE order_id = p_order_id AND status = 'held';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró una retención en custodia activa para esta orden.';
    END IF;

    -- Actualizar estado de retención y pago
    UPDATE public.escrow_holds
    SET status = 'released',
        released_at = now(),
        updated_at = now()
    WHERE id = v_escrow.id;

    UPDATE public.payments
    SET status = 'released',
        updated_at = now()
    WHERE id = v_escrow.payment_id;

    -- Payout al freelancer (recibe el 100% de net_amount)
    INSERT INTO public.payouts (
        order_id,
        freelancer_id,
        amount,
        status,
        payout_provider,
        provider_payout_id,
        processed_at
    ) VALUES (
        p_order_id,
        v_order.freelancer_id,
        v_escrow.net_amount,
        'completed',
        'simulado',
        'sim_po_' || substr(gen_random_uuid()::text, 1, 16),
        now()
    ) RETURNING id INTO v_payout_id;

    UPDATE public.orders
    SET status = 'aprobado',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        changed_by,
        comment
    ) VALUES (
        p_order_id,
        'entregado',
        'aprobado',
        v_user_id,
        COALESCE(p_comment, 'Entrega aprobada. Se liberaron Bs ' || v_escrow.net_amount || ' al freelancer (Comisión retenida: Bs ' || v_escrow.platform_fee || ').')
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payout_id', v_payout_id,
        'net_amount', v_escrow.net_amount,
        'platform_fee', v_escrow.platform_fee,
        'status', 'released'
    );
END;
$$;
