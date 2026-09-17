-- ============================================================
-- FASE 5: DISPUTAS Y MEDIACIÓN
-- ============================================================

-- 1. Tabla de Disputas
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    initiator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    respondent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('open', 'under_review', 'resolved', 'cancelled')) DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Tabla de Mensajes y Evidencias de la Disputa
CREATE TABLE IF NOT EXISTS public.dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_support BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Tabla de Resoluciones de Disputa (Inmutable)
CREATE TABLE IF NOT EXISTS public.dispute_resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID NOT NULL REFERENCES public.disputes(id) ON DELETE CASCADE UNIQUE,
    resolver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    decision TEXT NOT NULL CHECK (decision IN ('no_liberar', 'liberar_completo', 'liberar_parcial')),
    freelancer_percentage NUMERIC(5, 2) NOT NULL CHECK (freelancer_percentage >= 0 AND freelancer_percentage <= 100),
    resolution_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON public.disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_respondent_id ON public.disputes(respondent_id);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON public.dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created_at ON public.dispute_messages(created_at ASC);

CREATE INDEX IF NOT EXISTS idx_dispute_resolutions_dispute_id ON public.dispute_resolutions(dispute_id);

-- Triggers de timestamp
CREATE OR REPLACE TRIGGER trigger_update_disputes_timestamp
    BEFORE UPDATE ON public.disputes
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- SEGURIDAD A NIVEL DE FILA (RLS)
-- ============================================================
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_resolutions ENABLE ROW LEVEL SECURITY;

-- Políticas para disputes
DROP POLICY IF EXISTS "disputes_select_participants_or_support" ON public.disputes;
CREATE POLICY "disputes_select_participants_or_support"
    ON public.disputes FOR SELECT
    TO authenticated
    USING (
        initiator_id = auth.uid() OR
        respondent_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND active = true AND role IN ('soporte', 'admin')
        )
    );

DROP POLICY IF EXISTS "disputes_insert_authenticated" ON public.disputes;
CREATE POLICY "disputes_insert_authenticated"
    ON public.disputes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = initiator_id);

-- Políticas para dispute_messages
DROP POLICY IF EXISTS "dispute_messages_select_participants" ON public.dispute_messages;
CREATE POLICY "dispute_messages_select_participants"
    ON public.dispute_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_messages.dispute_id
            AND (
                d.initiator_id = auth.uid() OR
                d.respondent_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_id = auth.uid() AND active = true AND role IN ('soporte', 'admin')
                )
            )
        )
    );

DROP POLICY IF EXISTS "dispute_messages_insert_sender" ON public.dispute_messages;
CREATE POLICY "dispute_messages_insert_sender"
    ON public.dispute_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_messages.dispute_id
            AND (
                d.initiator_id = auth.uid() OR
                d.respondent_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_id = auth.uid() AND active = true AND role IN ('soporte', 'admin')
                )
            )
        )
    );

-- Políticas para dispute_resolutions
DROP POLICY IF EXISTS "dispute_resolutions_select" ON public.dispute_resolutions;
CREATE POLICY "dispute_resolutions_select"
    ON public.dispute_resolutions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.disputes d
            WHERE d.id = dispute_resolutions.dispute_id
            AND (
                d.initiator_id = auth.uid() OR
                d.respondent_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_id = auth.uid() AND active = true AND role IN ('soporte', 'admin')
                )
            )
        )
    );

-- ============================================================
-- PROCEDIMIENTOS ALMACENADOS (SECURITY DEFINER)
-- ============================================================

-- 1. Abrir Disputa / Solicitar Mediación Oficial
CREATE OR REPLACE FUNCTION public.open_order_dispute(
    p_order_id UUID,
    p_reason TEXT,
    p_description TEXT,
    p_initial_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order public.orders%ROWTYPE;
    v_user_id UUID;
    v_respondent_id UUID;
    v_dispute_id UUID;
    v_msg_content TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden % no encontrada.', p_order_id;
    END IF;

    -- Validar que el usuario sea parte de la orden
    IF v_order.client_id = v_user_id THEN
        v_respondent_id := v_order.freelancer_id;
    ELSIF v_order.freelancer_id = v_user_id THEN
        v_respondent_id := v_order.client_id;
    ELSE
        RAISE EXCEPTION 'No tienes permiso para abrir una disputa sobre esta orden.';
    END IF;

    -- Validar estado de la orden (solo en_progreso o entregado)
    IF v_order.status NOT IN ('en_progreso', 'entregado') THEN
        RAISE EXCEPTION 'Solo se puede abrir disputa en órdenes en progreso o entregadas (estado actual: %).', v_order.status;
    END IF;

    -- Verificar que no haya una disputa activa
    IF EXISTS (SELECT 1 FROM public.disputes WHERE order_id = p_order_id AND status IN ('open', 'under_review')) THEN
        RAISE EXCEPTION 'Ya existe una disputa activa en curso para esta orden.';
    END IF;

    -- 1. Crear disputa
    INSERT INTO public.disputes (
        order_id,
        initiator_id,
        respondent_id,
        reason,
        description,
        status
    ) VALUES (
        p_order_id,
        v_user_id,
        v_respondent_id,
        p_reason,
        p_description,
        'open'
    ) RETURNING id INTO v_dispute_id;

    -- 2. Mensaje inicial en el hilo de disputa
    v_msg_content := COALESCE(p_initial_message, p_description);
    INSERT INTO public.dispute_messages (
        dispute_id,
        sender_id,
        message,
        is_support
    ) VALUES (
        v_dispute_id,
        v_user_id,
        v_msg_content,
        false
    );

    -- 3. Actualizar estado de la orden a 'en_disputa'
    UPDATE public.orders
    SET status = 'en_disputa',
        updated_at = now()
    WHERE id = p_order_id;

    -- 4. Registrar en historial de auditoría de la orden
    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        changed_by,
        comment
    ) VALUES (
        p_order_id,
        v_order.status,
        'en_disputa',
        v_user_id,
        'Disputa abierta por motivo: "' || p_reason || '". Fondos de Escrow congelados temporalmente hasta mediación.'
    );

    RETURN jsonb_build_object(
        'success', true,
        'dispute_id', v_dispute_id,
        'order_id', p_order_id,
        'status', 'open'
    );
END;
$$;

-- 2. Resolver Disputa (Veredicto de Mediador)
CREATE OR REPLACE FUNCTION public.resolve_order_dispute(
    p_dispute_id UUID,
    p_decision TEXT,
    p_freelancer_percentage NUMERIC,
    p_resolution_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_dispute public.disputes%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_escrow public.escrow_holds%ROWTYPE;
    v_user_id UUID;
    v_payout_id UUID;
    v_payout_amount NUMERIC(10, 2);
    v_final_pct NUMERIC(5, 2);
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado.';
    END IF;

    SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Disputa % no encontrada.', p_dispute_id;
    END IF;

    IF v_dispute.status = 'resolved' THEN
        RAISE EXCEPTION 'Esta disputa ya ha sido resuelta previamente.';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = v_dispute.order_id;
    SELECT * INTO v_escrow FROM public.escrow_holds WHERE order_id = v_dispute.order_id;

    -- Validar decisión
    IF p_decision NOT IN ('no_liberar', 'liberar_completo', 'liberar_parcial') THEN
        RAISE EXCEPTION 'Decisión inválida. Opciones: no_liberar, liberar_completo, liberar_parcial.';
    END IF;

    -- Aplicar lógica de las 3 resoluciones sobre el Escrow
    IF p_decision = 'no_liberar' THEN
        v_final_pct := 0.00;
        -- Reembolso al cliente: liberar nada al freelancer
        IF v_escrow.id IS NOT NULL THEN
            UPDATE public.escrow_holds
            SET status = 'refunded', updated_at = now()
            WHERE id = v_escrow.id;

            UPDATE public.payments
            SET status = 'refunded', updated_at = now()
            WHERE id = v_escrow.payment_id;
        END IF;

        UPDATE public.orders
        SET status = 'cerrado', completed_at = now(), updated_at = now()
        WHERE id = v_order.id;

    ELSIF p_decision = 'liberar_completo' THEN
        v_final_pct := 100.00;
        -- Pago completo al freelancer
        IF v_escrow.id IS NOT NULL THEN
            UPDATE public.escrow_holds
            SET status = 'released', released_at = now(), updated_at = now()
            WHERE id = v_escrow.id;

            UPDATE public.payments
            SET status = 'released', updated_at = now()
            WHERE id = v_escrow.payment_id;

            INSERT INTO public.payouts (
                order_id,
                freelancer_id,
                amount,
                status,
                payout_provider,
                provider_payout_id,
                processed_at
            ) VALUES (
                v_order.id,
                v_order.freelancer_id,
                v_escrow.net_amount,
                'completed',
                'simulado',
                'sim_po_' || substr(gen_random_uuid()::text, 1, 16),
                now()
            ) RETURNING id INTO v_payout_id;
        END IF;

        UPDATE public.orders
        SET status = 'aprobado', completed_at = now(), updated_at = now()
        WHERE id = v_order.id;

    ELSIF p_decision = 'liberar_parcial' THEN
        v_final_pct := GREATEST(0.00, LEAST(100.00, p_freelancer_percentage));
        IF v_escrow.id IS NOT NULL THEN
            v_payout_amount := ROUND((v_escrow.net_amount * (v_final_pct / 100.0)), 2);

            UPDATE public.escrow_holds
            SET status = 'partially_released', released_at = now(), updated_at = now()
            WHERE id = v_escrow.id;

            UPDATE public.payments
            SET status = 'partially_refunded', updated_at = now()
            WHERE id = v_escrow.payment_id;

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
                    v_order.id,
                    v_order.freelancer_id,
                    v_payout_amount,
                    'completed',
                    'simulado',
                    'sim_po_' || substr(gen_random_uuid()::text, 1, 16),
                    now()
                ) RETURNING id INTO v_payout_id;
            END IF;
        END IF;

        UPDATE public.orders
        SET status = 'cerrado', completed_at = now(), updated_at = now()
        WHERE id = v_order.id;
    END IF;

    -- 1. Insertar registro inmutable de resolución
    INSERT INTO public.dispute_resolutions (
        dispute_id,
        resolver_id,
        decision,
        freelancer_percentage,
        resolution_notes
    ) VALUES (
        p_dispute_id,
        v_user_id,
        p_decision,
        v_final_pct,
        p_resolution_notes
    );

    -- 2. Marcar disputa como resuelta
    UPDATE public.disputes
    SET status = 'resolved',
        updated_at = now()
    WHERE id = p_dispute_id;

    -- 3. Mensaje oficial de soporte en el hilo
    INSERT INTO public.dispute_messages (
        dispute_id,
        sender_id,
        message,
        is_support
    ) VALUES (
        p_dispute_id,
        v_user_id,
        '⚖️ Veredicto Oficial emitido (' || p_decision || ' - ' || v_final_pct || '% freelancer). Motivo: ' || p_resolution_notes,
        true
    );

    -- 4. Registrar en historial de la orden
    INSERT INTO public.order_status_history (
        order_id,
        previous_status,
        new_status,
        changed_by,
        comment
    ) VALUES (
        v_order.id,
        'en_disputa',
        (SELECT status FROM public.orders WHERE id = v_order.id),
        v_user_id,
        'Disputa resuelta mediante mediación: ' || p_decision || ' (' || v_final_pct || '% fondos al freelancer). ' || p_resolution_notes
    );

    RETURN jsonb_build_object(
        'success', true,
        'dispute_id', p_dispute_id,
        'order_id', v_order.id,
        'decision', p_decision,
        'freelancer_percentage', v_final_pct,
        'status', 'resolved'
    );
END;
$$;
