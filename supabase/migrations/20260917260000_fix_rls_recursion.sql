-- ==============================================================================
-- FASE 11: Corrección de Recursión Infinita en Políticas RLS
-- ==============================================================================
-- Las políticas de user_roles que hacían subqueries a public.user_roles provocaban
-- 'infinite recursion detected in policy for relation user_roles'.
-- Solución estándar de Supabase/Postgres: Funciones SECURITY DEFINER que leen
-- roles sin disparar evaluación recursiva de RLS.
-- ==============================================================================

-- 1. Funciones auxiliares STABLE y SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.has_role(lookup_user_id UUID, check_role public.role_type)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = lookup_user_id
      AND role = check_role
      AND active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_support_or_admin(lookup_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = lookup_user_id
      AND active = true
      AND role IN ('soporte'::role_type, 'admin'::role_type)
  );
$$;

-- 2. Corregir políticas en public.user_roles
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    );

DROP POLICY IF EXISTS "user_roles_manage_admin" ON public.user_roles;
CREATE POLICY "user_roles_manage_admin"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin'::role_type)
    )
    WITH CHECK (
        public.has_role(auth.uid(), 'admin'::role_type)
    );

-- 3. Optimizar políticas en otras tablas para usar estas funciones seguras
-- 3.1 orders
DROP POLICY IF EXISTS "orders_select_support" ON public.orders;
CREATE POLICY "orders_select_support"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    );

-- 3.2 escrow_holds
DROP POLICY IF EXISTS "escrow_holds_select_support" ON public.escrow_holds;
CREATE POLICY "escrow_holds_select_support"
    ON public.escrow_holds FOR SELECT
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    );

-- 3.3 payments
DROP POLICY IF EXISTS "payments_select_support" ON public.payments;
CREATE POLICY "payments_select_support"
    ON public.payments FOR SELECT
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    );

-- 3.4 payouts
DROP POLICY IF EXISTS "payouts_select_support" ON public.payouts;
CREATE POLICY "payouts_select_support"
    ON public.payouts FOR SELECT
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    );

-- 3.5 platform_fees
DROP POLICY IF EXISTS "platform_fees_select_support" ON public.platform_fees;
CREATE POLICY "platform_fees_select_support"
    ON public.platform_fees FOR SELECT
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    );

-- 3.6 dispute_resolutions
DROP POLICY IF EXISTS "dispute_resolutions_manage_support" ON public.dispute_resolutions;
CREATE POLICY "dispute_resolutions_manage_support"
    ON public.dispute_resolutions FOR ALL
    TO authenticated
    USING (
        public.is_support_or_admin(auth.uid())
    )
    WITH CHECK (
        public.is_support_or_admin(auth.uid())
    );

-- 3.7 disputes
DROP POLICY IF EXISTS "disputes_select_participants_or_support" ON public.disputes;
CREATE POLICY "disputes_select_participants_or_support"
    ON public.disputes FOR SELECT
    TO authenticated
    USING (
        initiator_id = auth.uid() OR
        respondent_id = auth.uid() OR
        public.is_support_or_admin(auth.uid())
    );

-- 3.8 dispute_messages
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
                public.is_support_or_admin(auth.uid())
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
                public.is_support_or_admin(auth.uid())
            )
        )
    );

-- 3.9 conversations
DROP POLICY IF EXISTS "conversations_select_participants" ON public.conversations;
CREATE POLICY "conversations_select_participants"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (
        auth.uid() = client_id OR
        auth.uid() = freelancer_id OR
        public.is_support_or_admin(auth.uid())
    );

-- 3.10 messages
DROP POLICY IF EXISTS "messages_select_participants" ON public.messages;
CREATE POLICY "messages_select_participants"
    ON public.messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id
            AND (c.client_id = auth.uid() OR c.freelancer_id = auth.uid())
        )
        OR public.is_support_or_admin(auth.uid())
    );
