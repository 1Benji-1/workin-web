-- ==============================================================================
-- FASE 8: NOTIFICACIONES (Web Realtime & Emails Transaccionales)
-- ==============================================================================
-- Tabla centralizada de notificaciones, triggers automáticos para hitos de órdenes,
-- mensajes y disputas, políticas RLS y publicación en Supabase Realtime.
-- ==============================================================================

-- 1. Tabla de Notificaciones
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text not null,
    message text not null,
    type text not null, -- 'order_status', 'order_escrow_funded', 'order_delivered', 'order_approved', 'dispute_opened', 'dispute_resolved', 'new_message', 'system'
    data jsonb not null default '{}'::jsonb,
    is_read boolean not null default false,
    read_at timestamptz,
    created_at timestamptz not null default now()
);

-- Índices de optimización
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read) where is_read = false;

-- 2. Seguridad a Nivel de Filas (RLS)
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
    on public.notifications for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
    on public.notifications for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
    on public.notifications for insert
    to authenticated
    with check (true);

-- 3. Triggers Automáticos en PostgreSQL

-- Trigger A: Notificar cambios de estado en Órdenes
create or replace function public.trigger_notify_order_status_change()
returns trigger
language plpgsql
security definer
as $$
declare
    freelancer_name text;
    client_name text;
begin
    -- Solo actuar si el estado de la orden cambió efectivamente
    if OLD.status is distinct from NEW.status then
        -- Obtener nombres para los mensajes
        select coalesce(full_name, 'El freelancer') into freelancer_name from public.profiles where id = NEW.freelancer_id;
        select coalesce(full_name, 'El cliente') into client_name from public.profiles where id = NEW.client_id;

        -- 1. esperando_pago: Notificar al cliente
        if NEW.status = 'esperando_pago' then
            insert into public.notifications (user_id, title, message, type, data)
            values (
                NEW.client_id,
                'Depósito requerido para iniciar',
                'El acuerdo para "' || NEW.title || '" está listo. Deposita los fondos en garantía para comenzar.',
                'order_status',
                jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'url', '/orders/' || NEW.id)
            );

        -- 2. en_progreso: Fondos depositados en Escrow -> Notificar al freelancer
        elsif NEW.status = 'en_progreso' then
            insert into public.notifications (user_id, title, message, type, data)
            values (
                NEW.freelancer_id,
                'Fondos en Garantía Depositados 💰',
                'El cliente ha depositado los fondos para "' || NEW.title || '". ¡Ya puedes comenzar a trabajar!',
                'order_escrow_funded',
                jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'url', '/orders/' || NEW.id)
            );

        -- 3. entregado: Trabajo entregado -> Notificar al cliente
        elsif NEW.status = 'entregado' then
            insert into public.notifications (user_id, title, message, type, data)
            values (
                NEW.client_id,
                'Entrega de Trabajo Realizada 📦',
                freelancer_name || ' ha entregado el trabajo para "' || NEW.title || '". Por favor revísalo.',
                'order_delivered',
                jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'url', '/orders/' || NEW.id)
            );

        -- 4. aprobado: Aprobado -> Notificar al freelancer que los fondos se liberaron
        elsif NEW.status = 'aprobado' then
            insert into public.notifications (user_id, title, message, type, data)
            values (
                NEW.freelancer_id,
                '¡Entrega Aprobada y Pago Liberado! 🎉',
                client_name || ' aprobó la entrega de "' || NEW.title || '". Los fondos han sido transferidos a tu cuenta.',
                'order_approved',
                jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'url', '/orders/' || NEW.id)
            );

        -- 5. en_disputa: Notificar a ambas partes
        elsif NEW.status = 'en_disputa' then
            insert into public.notifications (user_id, title, message, type, data)
            values (
                NEW.client_id,
                'Orden en Disputa ⚠️',
                'El pedido "' || NEW.title || '" ha entrado en proceso de mediación con soporte.',
                'dispute_update',
                jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'url', '/orders/' || NEW.id)
            ),
            (
                NEW.freelancer_id,
                'Orden en Disputa ⚠️',
                'El pedido "' || NEW.title || '" ha entrado en proceso de mediación con soporte.',
                'dispute_update',
                jsonb_build_object('order_id', NEW.id, 'status', NEW.status, 'url', '/orders/' || NEW.id)
            );
        end if;
    end if;

    return NEW;
end;
$$;

drop trigger if exists trg_notify_order_status_change on public.orders;
create trigger trg_notify_order_status_change
    after update of status on public.orders
    for each row
    execute function public.trigger_notify_order_status_change();


-- Trigger B: Notificar nuevos mensajes en el Chat
create or replace function public.trigger_notify_new_message()
returns trigger
language plpgsql
security definer
as $$
declare
    conv record;
    target_user_id uuid;
    sender_name text;
    preview_text text;
begin
    -- Obtener la conversación y determinar el destinatario
    select client_id, freelancer_id, order_id into conv
    from public.conversations
    where id = NEW.conversation_id;

    if found then
        if NEW.sender_id = conv.client_id then
            target_user_id := conv.freelancer_id;
        else
            target_user_id := conv.client_id;
        end if;

        -- Obtener nombre del remitente
        select coalesce(full_name, 'Usuario') into sender_name
        from public.profiles
        where id = NEW.sender_id;

        -- Truncar contenido si es muy extenso
        if char_length(NEW.content) > 60 then
            preview_text := substring(NEW.content from 1 for 57) || '...';
        else
            preview_text := NEW.content;
        end if;

        insert into public.notifications (user_id, title, message, type, data)
        values (
            target_user_id,
            'Nuevo mensaje de ' || sender_name || ' 💬',
            preview_text,
            'new_message',
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'order_id', conv.order_id,
                'sender_id', NEW.sender_id,
                'url', '/messages/' || NEW.conversation_id
            )
        );
    end if;

    return NEW;
end;
$$;

drop trigger if exists trg_notify_new_message on public.messages;
create trigger trg_notify_new_message
    after insert on public.messages
    for each row
    execute function public.trigger_notify_new_message();


-- Trigger C: Notificar apertura o resolución de disputas
create or replace function public.trigger_notify_dispute_event()
returns trigger
language plpgsql
security definer
as $$
declare
    ord record;
    initiator_name text;
begin
    select title into ord from public.orders where id = NEW.order_id;
    select coalesce(full_name, 'La otra parte') into initiator_name from public.profiles where id = NEW.initiator_id;

    -- Si es una nueva disputa
    if TG_OP = 'INSERT' then
        insert into public.notifications (user_id, title, message, type, data)
        values (
            NEW.respondent_id,
            'Disputa abierta en tu pedido ⚠️',
            initiator_name || ' ha iniciado una disputa sobre "' || coalesce(ord.title, 'el pedido') || '". Motivo: ' || NEW.reason,
            'dispute_opened',
            jsonb_build_object('dispute_id', NEW.id, 'order_id', NEW.order_id, 'url', '/disputes/' || NEW.id)
        );
    -- Si la disputa cambió a resuelta
    elsif TG_OP = 'UPDATE' and OLD.status is distinct from NEW.status and NEW.status = 'resolved' then
        insert into public.notifications (user_id, title, message, type, data)
        values 
        (
            NEW.initiator_id,
            'Disputa Resuelta ✅',
            'El equipo de mediación ha resuelto la disputa de "' || coalesce(ord.title, 'el pedido') || '".',
            'dispute_resolved',
            jsonb_build_object('dispute_id', NEW.id, 'order_id', NEW.order_id, 'url', '/disputes/' || NEW.id)
        ),
        (
            NEW.respondent_id,
            'Disputa Resuelta ✅',
            'El equipo de mediación ha resuelto la disputa de "' || coalesce(ord.title, 'el pedido') || '".',
            'dispute_resolved',
            jsonb_build_object('dispute_id', NEW.id, 'order_id', NEW.order_id, 'url', '/disputes/' || NEW.id)
        );
    end if;

    return NEW;
end;
$$;

drop trigger if exists trg_notify_dispute_event on public.disputes;
create trigger trg_notify_dispute_event
    after insert or update of status on public.disputes
    for each row
    execute function public.trigger_notify_dispute_event();


-- 4. Registro en Supabase Realtime
do $$
begin
    if not exists (
        select 1 from pg_publication_tables 
        where pubname = 'supabase_realtime' and tablename = 'notifications'
    ) then
        alter publication supabase_realtime add table public.notifications;
    end if;
end $$;
