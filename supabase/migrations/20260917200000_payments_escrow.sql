-- ============================================================
-- FASE 4: PAGOS Y SISTEMA ESCROW (CUSTODIA DE FONDOS)
-- ============================================================

-- 1. Tabla de Pagos Realizados por Clientes
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'held_in_escrow',
        'released',
        'partially_refunded',
        'refunded',
        'failed'
    )) DEFAULT 'pending',
    payment_provider TEXT NOT NULL DEFAULT 'simulado',
    provider_transaction_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Retenciones en Custodia (Escrow Holds)
CREATE TABLE IF NOT EXISTS public.escrow_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    platform_fee NUMERIC(10, 2) NOT NULL CHECK (platform_fee >= 0),
    net_amount NUMERIC(10, 2) NOT NULL CHECK (net_amount > 0),
    status TEXT NOT NULL CHECK (status IN (
        'held',
        'released',
        'partially_released',
        'refunded'
    )) DEFAULT 'held',
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla de Desembolsos a Freelancers (Payouts)
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL CHECK (status IN (
        'pending',
        'completed',
        'failed'
    )) DEFAULT 'pending',
    payout_provider TEXT NOT NULL DEFAULT 'simulado',
    provider_payout_id TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabla de Comisiones de la Plataforma
CREATE TABLE IF NOT EXISTS public.platform_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    escrow_id UUID NOT NULL REFERENCES public.escrow_holds(id) ON DELETE CASCADE,
    fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
    fee_amount NUMERIC(10, 2) NOT NULL CHECK (fee_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON public.payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_escrow_holds_order_id ON public.escrow_holds(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holds_status ON public.escrow_holds(status);

CREATE INDEX IF NOT EXISTS idx_payouts_order_id ON public.payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_payouts_freelancer_id ON public.payouts(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);

-- Triggers de actualización de updated_at
CREATE OR REPLACE TRIGGER trigger_update_payments_timestamp
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trigger_update_escrow_holds_timestamp
    BEFORE UPDATE ON public.escrow_holds
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SEGURIDAD A NIVEL DE FILA (RLS)
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;

-- Políticas de payments: solo cliente y freelancer de la orden pueden consultar
DROP POLICY IF EXISTS "payments_select_participants" ON public.payments;
CREATE POLICY "payments_select_participants"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        client_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id AND o.freelancer_id = auth.uid()
        )
    );

-- Políticas de escrow_holds: participantes de la orden pueden consultar
DROP POLICY IF EXISTS "escrow_holds_select_participants" ON public.escrow_holds;
CREATE POLICY "escrow_holds_select_participants"
    ON public.escrow_holds FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = escrow_holds.order_id AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    );

-- Políticas de payouts: freelancer receptor puede consultar sus pagos
DROP POLICY IF EXISTS "payouts_select_recipient" ON public.payouts;
CREATE POLICY "payouts_select_recipient"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (
        freelancer_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payouts.order_id AND o.client_id = auth.uid()
        )
    );

-- Políticas de platform_fees: solo participantes de la orden pueden consultar
DROP POLICY IF EXISTS "platform_fees_select_participants" ON public.platform_fees;
CREATE POLICY "platform_fees_select_participants"
    ON public.platform_fees FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = platform_fees.order_id AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    );

-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS ATÓMICOS (SECURITY DEFINER)
-- Toda manipulación financiera ocurre en el motor de base de datos
-- ============================================================

-- 1. Procesar Depósito en Custodia (Escrow Simulado)
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

    -- Calcular comisiones (10% estándar de plataforma)
    v_fee := ROUND(v_order.price * 0.10, 2);
    v_net := v_order.price - v_fee;

    -- 1. Registrar pago simulado
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
        'USD',
        'held_in_escrow',
        'simulado',
        'sim_tx_' || substr(gen_random_uuid()::text, 1, 16)
    ) RETURNING id INTO v_payment_id;

    -- 2. Registrar retención en Escrow
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

    -- 3. Registrar registro de comisión de plataforma
    INSERT INTO public.platform_fees (
        order_id,
        escrow_id,
        fee_percentage,
        fee_amount
    ) VALUES (
        p_order_id,
        v_escrow_id,
        10.00,
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
        'Depósito de $' || v_order.price || ' USD asegurado en Escrow (' || p_payment_method || '). El freelancer puede iniciar el trabajo.'
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

-- 2. Liberar Fondos de Escrow al Freelancer (Aprobación de Entrega)
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

    -- Obtener orden
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden % no encontrada.', p_order_id;
    END IF;

    -- Solo el cliente de la orden puede aprobar y liberar fondos
    IF v_order.client_id != v_user_id THEN
        RAISE EXCEPTION 'Solo el cliente de la orden puede liberar los fondos.';
    END IF;

    -- Debe estar en estado 'entregado'
    IF v_order.status != 'entregado' THEN
        RAISE EXCEPTION 'La orden debe haber sido entregada antes de liberar fondos (estado actual: %).', v_order.status;
    END IF;

    -- Obtener retención en custodia activa
    SELECT * INTO v_escrow
    FROM public.escrow_holds
    WHERE order_id = p_order_id AND status = 'held';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró una retención en custodia activa para esta orden.';
    END IF;

    -- 1. Actualizar estado de la retención
    UPDATE public.escrow_holds
    SET status = 'released',
        released_at = now(),
        updated_at = now()
    WHERE id = v_escrow.id;

    -- 2. Actualizar estado del pago original
    UPDATE public.payments
    SET status = 'released',
        updated_at = now()
    WHERE id = v_escrow.payment_id;

    -- 3. Crear desembolso (payout) para el freelancer
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

    -- 4. Actualizar estado de la orden a 'aprobado'
    UPDATE public.orders
    SET status = 'aprobado',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    -- 5. Registrar en historial de auditoría
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
        COALESCE(p_comment, 'Entrega aprobada. Se liberaron $' || v_escrow.net_amount || ' USD al freelancer (Comisión: $' || v_escrow.platform_fee || ' USD).')
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

-- 3. Liberación Parcial de Fondos (Mediación de Disputas / Soporte - Fase 5 y 9)
CREATE OR REPLACE FUNCTION public.partial_release_escrow_payment(
    p_order_id UUID,
    p_freelancer_percentage NUMERIC,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_escrow public.escrow_holds%ROWTYPE;
    v_user_id UUID;
    v_payout_amount NUMERIC(10, 2);
    v_payout_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    IF p_freelancer_percentage < 0 OR p_freelancer_percentage > 100 THEN
        RAISE EXCEPTION 'El porcentaje debe estar entre 0 y 100.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden % no encontrada.', p_order_id;
    END IF;

    SELECT * INTO v_escrow FROM public.escrow_holds WHERE order_id = p_order_id AND status = 'held';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se encontró retención activa para la orden.';
    END IF;

    v_payout_amount := ROUND((v_escrow.net_amount * (p_freelancer_percentage / 100.0)), 2);

    -- Actualizar escrow
    UPDATE public.escrow_holds
    SET status = 'partially_released',
        released_at = now(),
        updated_at = now()
    WHERE id = v_escrow.id;

    -- Actualizar payment
    UPDATE public.payments
    SET status = 'partially_refunded',
        updated_at = now()
    WHERE id = v_escrow.payment_id;

    -- Generar payout al freelancer si corresponde
    IF v_payout_amount > 0 THEN
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
            v_payout_amount,
            'completed',
            'simulado',
            'sim_po_' || substr(gen_random_uuid()::text, 1, 16),
            now()
        ) RETURNING id INTO v_payout_id;
    END IF;

    -- Cerrar orden
    UPDATE public.orders
    SET status = 'cerrado',
        completed_at = now(),
        updated_at = now()
    WHERE id = p_order_id;

    -- Registrar auditoría
    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        changed_by,
        comment
    ) VALUES (
        p_order_id,
        v_order.status,
        'cerrado',
        v_user_id,
        'Resolución de mediación: ' || p_reason || '. ' || p_freelancer_percentage || '% ($' || v_payout_amount || ' USD) liberado al freelancer.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'payout_amount', v_payout_amount,
        'freelancer_percentage', p_freelancer_percentage,
        'status', 'partially_released'
    );
END;
$$;
