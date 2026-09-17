-- Migración Fase 3: Tablas para Contratación, Acuerdos y Seguimiento de Órdenes

-- 1. Tabla de Órdenes / Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    freelancer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
    package_id uuid REFERENCES public.service_packages(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text NOT NULL,
    price numeric(10,2) NOT NULL CHECK (price >= 0),
    delivery_days integer NOT NULL CHECK (delivery_days > 0),
    status text NOT NULL CHECK (status IN (
        'pendiente_acuerdo',
        'acordado',
        'esperando_pago',
        'en_progreso',
        'entregado',
        'aprobado',
        'en_disputa',
        'cerrado'
    )) DEFAULT 'pendiente_acuerdo',
    agreed_at timestamptz,
    payment_activated_at timestamptz,
    delivery_due_date timestamptz,
    delivered_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla de Requerimientos / Entregables acordados
CREATE TABLE IF NOT EXISTS public.order_requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    description text NOT NULL,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Historial de Auditoría de Estados de la Orden
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status text,
    new_status text NOT NULL,
    changed_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    comment text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_freelancer_id ON public.orders(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_requirements_order_id ON public.order_requirements(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Orders
-- Lectura: Solo el cliente o el freelancer involucrados
DROP POLICY IF EXISTS orders_select_involved ON public.orders;
CREATE POLICY orders_select_involved ON public.orders
    FOR SELECT
    TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Inserción: El cliente autenticado puede crear órdenes
DROP POLICY IF EXISTS orders_insert_client ON public.orders;
CREATE POLICY orders_insert_client ON public.orders
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = client_id);

-- Actualización: Solo participantes de la orden
DROP POLICY IF EXISTS orders_update_involved ON public.orders;
CREATE POLICY orders_update_involved ON public.orders
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = client_id OR auth.uid() = freelancer_id)
    WITH CHECK (auth.uid() = client_id OR auth.uid() = freelancer_id);

-- Políticas RLS para Order Requirements
DROP POLICY IF EXISTS order_requirements_select ON public.order_requirements;
CREATE POLICY order_requirements_select ON public.order_requirements
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_requirements.order_id
            AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS order_requirements_all_involved ON public.order_requirements;
CREATE POLICY order_requirements_all_involved ON public.order_requirements
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_requirements.order_id
            AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_requirements.order_id
            AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    );

-- Políticas RLS para Order Status History
DROP POLICY IF EXISTS order_status_history_select ON public.order_status_history;
CREATE POLICY order_status_history_select ON public.order_status_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_status_history.order_id
            AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS order_status_history_insert ON public.order_status_history;
CREATE POLICY order_status_history_insert ON public.order_status_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = changed_by AND
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_status_history.order_id
            AND (o.client_id = auth.uid() OR o.freelancer_id = auth.uid())
        )
    );
