-- ============================================================
-- Fase 7: Mensajería y Chat en Tiempo Real
-- ============================================================

-- 1. Tabla conversations (hilos de chat directo u orden)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  last_message text,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.conversations is 'Hilos de chat directo entre clientes y freelancers, opcionalmente vinculados a un pedido';
comment on column public.conversations.order_id is 'Referencia opcional al pedido sobre el cual se conversa';
comment on column public.conversations.last_message is 'Extracto del último mensaje enviado para previsualización rápida';
comment on column public.conversations.last_message_at is 'Timestamp del último mensaje para ordenamiento cronológico';

-- Evitar conversaciones duplicadas para una misma orden entre las mismas partes
create unique index if not exists idx_conversations_unique_order 
  on public.conversations(client_id, freelancer_id, order_id) 
  where order_id is not null;

-- Evitar conversaciones generales duplicadas sin orden
create unique index if not exists idx_conversations_unique_direct 
  on public.conversations(client_id, freelancer_id) 
  where order_id is null;

-- 2. Tabla messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) > 0),
  attachments jsonb not null default '[]'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.messages is 'Mensajes individuales intercambiados dentro de una conversación';
comment on column public.messages.attachments is 'Array JSONB con archivos, imágenes o evidencias compartidas en el chat';
comment on column public.messages.is_read is 'Indica si el receptor ya leyó el mensaje';

-- 3. Índices de alto rendimiento
create index if not exists idx_conversations_client_id on public.conversations(client_id);
create index if not exists idx_conversations_freelancer_id on public.conversations(freelancer_id);
create index if not exists idx_conversations_order_id on public.conversations(order_id);
create index if not exists idx_conversations_last_message_at on public.conversations(last_message_at desc);

create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_created_at on public.messages(created_at asc);

-- 4. Triggers
-- Updated_at en conversations
drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row
  execute function public.set_updated_at();

-- Actualización automática del último mensaje
create or replace function public.update_conversation_last_message()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.conversations
  set last_message = new.content,
      last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_update_conversation_last_message on public.messages;
create trigger trg_update_conversation_last_message
  after insert on public.messages
  for each row
  execute function public.update_conversation_last_message();

-- 5. Row Level Security (RLS)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Políticas de conversations
drop policy if exists "conversations_select_participants" on public.conversations;
create policy "conversations_select_participants"
  on public.conversations for select
  to authenticated
  using (
    auth.uid() = client_id or auth.uid() = freelancer_id
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.active = true
        and ur.role in ('admin', 'soporte')
    )
  );

drop policy if exists "conversations_insert_participants" on public.conversations;
create policy "conversations_insert_participants"
  on public.conversations for insert
  to authenticated
  with check (
    auth.uid() = client_id or auth.uid() = freelancer_id
  );

drop policy if exists "conversations_update_participants" on public.conversations;
create policy "conversations_update_participants"
  on public.conversations for update
  to authenticated
  using (
    auth.uid() = client_id or auth.uid() = freelancer_id
  )
  with check (
    auth.uid() = client_id or auth.uid() = freelancer_id
  );

-- Políticas de messages
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())
    )
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.active = true
        and ur.role in ('admin', 'soporte')
    )
  );

drop policy if exists "messages_insert_sender" on public.messages;
create policy "messages_insert_sender"
  on public.messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())
    )
  );

drop policy if exists "messages_update_read" on public.messages;
create policy "messages_update_read"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.client_id = auth.uid() or c.freelancer_id = auth.uid())
    )
  );

-- 6. Integración Realtime
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
