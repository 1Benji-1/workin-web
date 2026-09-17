-- ==============================================================================
-- FASE 9: PANEL DE SOPORTE / BACKOFFICE
-- ==============================================================================
-- 1. Políticas RLS para lectura y gestión por roles 'admin' y 'soporte'.
-- 2. Función RPC atómica para métricas agregadas del panel de control.
-- 3. Procedimiento RPC para asignación de roles por administradores.
-- 4. Asignación inicial de rol 'admin' al usuario actual de desarrollo.
-- ==============================================================================

-- 1. Políticas RLS para soporte y administración

-- 1.1 Órdenes: Acceso de lectura para admin y soporte
drop policy if exists "orders_select_support" on public.orders;
create policy "orders_select_support"
    on public.orders for select
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );

-- 1.2 Escrow Holds: Acceso de lectura para admin y soporte
drop policy if exists "escrow_holds_select_support" on public.escrow_holds;
create policy "escrow_holds_select_support"
    on public.escrow_holds for select
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );

-- 1.3 Pagos: Acceso de lectura para admin y soporte
drop policy if exists "payments_select_support" on public.payments;
create policy "payments_select_support"
    on public.payments for select
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );

-- 1.4 Payouts: Acceso de lectura para admin y soporte
drop policy if exists "payouts_select_support" on public.payouts;
create policy "payouts_select_support"
    on public.payouts for select
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );

-- 1.5 Comisiones de Plataforma: Acceso de lectura para admin y soporte
drop policy if exists "platform_fees_select_support" on public.platform_fees;
create policy "platform_fees_select_support"
    on public.platform_fees for select
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );

-- 1.6 User Roles: Acceso de lectura y gestión para admin
drop policy if exists "user_roles_select_admin" on public.user_roles;
create policy "user_roles_select_admin"
    on public.user_roles for select
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );

drop policy if exists "user_roles_manage_admin" on public.user_roles;
create policy "user_roles_manage_admin"
    on public.user_roles for all
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = 'admin'::role_type
        )
    )
    with check (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = 'admin'::role_type
        )
    );

-- 1.7 Resoluciones de Disputa: Acceso de inserción y actualización para admin y soporte
drop policy if exists "dispute_resolutions_manage_support" on public.dispute_resolutions;
create policy "dispute_resolutions_manage_support"
    on public.dispute_resolutions for all
    to authenticated
    using (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    )
    with check (
        exists (
            select 1 from public.user_roles ur
            where ur.user_id = auth.uid()
              and ur.active = true
              and ur.role = any (array['soporte'::role_type, 'admin'::role_type])
        )
    );


-- 2. Función RPC para Métricas Globales del Dashboard Administrativo
create or replace function public.get_admin_dashboard_metrics()
returns jsonb
language plpgsql
security definer
as $$
declare
    v_total_users integer;
    v_clients_count integer;
    v_freelancers_count integer;
    v_support_count integer;
    v_admins_count integer;
    
    v_total_orders integer;
    v_active_orders integer;
    v_completed_orders integer;
    v_disputed_orders integer;
    
    v_open_disputes integer;
    v_resolved_disputes integer;
    
    v_total_escrow_held numeric(12, 2);
    v_total_escrow_released numeric(12, 2);
    v_total_platform_fees numeric(12, 2);
begin
    -- Verificar que el invocador sea admin o soporte
    if not exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
          and active = true
          and role = any (array['soporte'::role_type, 'admin'::role_type])
    ) then
        raise exception 'Acceso denegado. Se requiere rol de soporte o administrador.';
    end if;

    -- Conteo de usuarios
    select count(*) into v_total_users from public.profiles;
    select count(distinct user_id) into v_clients_count from public.user_roles where role = 'cliente' and active = true;
    select count(distinct user_id) into v_freelancers_count from public.user_roles where role = 'freelancer' and active = true;
    select count(distinct user_id) into v_support_count from public.user_roles where role = 'soporte' and active = true;
    select count(distinct user_id) into v_admins_count from public.user_roles where role = 'admin' and active = true;

    -- Conteo de órdenes
    select count(*) into v_total_orders from public.orders;
    select count(*) into v_active_orders from public.orders where status in ('esperando_pago', 'en_progreso', 'entregado', 'acordado');
    select count(*) into v_completed_orders from public.orders where status in ('aprobado', 'cerrado');
    select count(*) into v_disputed_orders from public.orders where status = 'en_disputa';

    -- Conteo de disputas
    select count(*) into v_open_disputes from public.disputes where status in ('open', 'under_review');
    select count(*) into v_resolved_disputes from public.disputes where status in ('resolved', 'cancelled');

    -- Volúmenes financieros
    select coalesce(sum(amount), 0.00) into v_total_escrow_held from public.escrow_holds where status = 'held';
    select coalesce(sum(amount), 0.00) into v_total_escrow_released from public.escrow_holds where status = 'released';
    select coalesce(sum(fee_amount), 0.00) into v_total_platform_fees from public.platform_fees;

    return jsonb_build_object(
        'users', jsonb_build_object(
            'total', v_total_users,
            'clients', v_clients_count,
            'freelancers', v_freelancers_count,
            'support', v_support_count,
            'admins', v_admins_count
        ),
        'orders', jsonb_build_object(
            'total', v_total_orders,
            'active', v_active_orders,
            'completed', v_completed_orders,
            'disputed', v_disputed_orders
        ),
        'disputes', jsonb_build_object(
            'open', v_open_disputes,
            'resolved', v_resolved_disputes
        ),
        'financials', jsonb_build_object(
            'escrow_held', v_total_escrow_held,
            'escrow_released', v_total_escrow_released,
            'platform_fees', v_total_platform_fees
        )
    );
end;
$$;


-- 3. Procedimiento para asignación de roles por Administradores
create or replace function public.admin_update_user_role(
    p_user_id uuid,
    p_role role_type,
    p_active boolean
)
returns jsonb
language plpgsql
security definer
as $$
begin
    -- Verificar que el invocador sea admin
    if not exists (
        select 1 from public.user_roles
        where user_id = auth.uid()
          and active = true
          and role = 'admin'::role_type
    ) then
        raise exception 'Acceso denegado. Solo administradores pueden gestionar roles.';
    end if;

    insert into public.user_roles (user_id, role, active)
    values (p_user_id, p_role, p_active)
    on conflict (user_id, role)
    do update set active = p_active;

    return jsonb_build_object(
        'success', true,
        'user_id', p_user_id,
        'role', p_role,
        'active', p_active
    );
end;
$$;


-- 4. Asignar rol 'admin' al usuario actual de desarrollo
do $$
declare
    v_dev_user_id uuid;
begin
    -- Si existe Isabel o un primer perfil, otorgarle admin
    select id into v_dev_user_id from public.profiles order by created_at asc limit 1;
    if v_dev_user_id is not null then
        insert into public.user_roles (user_id, role, active)
        values (v_dev_user_id, 'admin', true)
        on conflict (user_id, role)
        do update set active = true;
    end if;
end $$;
