-- ============================================================
-- Fase 6: Reputación y Reseñas (Reviews & Ratings)
-- ============================================================

-- 1. Agregar métricas de reputación a public.profiles
alter table public.profiles
  add column if not exists rating_avg numeric(3,2) not null default 0.00,
  add column if not exists reviews_count integer not null default 0;

comment on column public.profiles.rating_avg is 'Promedio general de calificaciones recibidas como freelancer (1.00 - 5.00)';
comment on column public.profiles.reviews_count is 'Total de reseñas recibidas como freelancer';

-- 2. Tabla de Reseñas (reviews)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null check (char_length(comment) >= 5),
  freelancer_reply text,
  freelancer_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reviews is 'Reseñas y calificaciones verificadas emitidas por clientes tras finalizar una orden';
comment on column public.reviews.rating is 'Puntuación otorgada del 1 al 5';
comment on column public.reviews.comment is 'Comentario explicativo de la experiencia del cliente';
comment on column public.reviews.freelancer_reply is 'Respuesta o aclaración oficial emitida por el freelancer';
comment on column public.reviews.freelancer_replied_at is 'Fecha y hora en que el freelancer emitió su respuesta';

-- 3. Índices de alto rendimiento
create index if not exists idx_reviews_freelancer_id on public.reviews(freelancer_id);
create index if not exists idx_reviews_client_id on public.reviews(client_id);
create index if not exists idx_reviews_service_id on public.reviews(service_id);
create index if not exists idx_reviews_order_id on public.reviews(order_id);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);

-- 4. Trigger updated_at
drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row
  execute function public.set_updated_at();

-- 5. Trigger y función atómica para recalcular estadísticas en profiles y services
create or replace function public.update_review_stats()
returns trigger
language plpgsql
security definer
as $$
declare
  v_freelancer_id uuid;
  v_service_id uuid;
  v_f_avg numeric(3,2);
  v_f_count integer;
  v_s_avg numeric(3,2);
  v_s_count integer;
begin
  if (tg_op = 'DELETE') then
    v_freelancer_id := old.freelancer_id;
    v_service_id := old.service_id;
  else
    v_freelancer_id := new.freelancer_id;
    v_service_id := new.service_id;
  end if;

  -- Recalcular estadísticas del freelancer en public.profiles
  if v_freelancer_id is not null then
    select coalesce(round(avg(rating)::numeric, 2), 0.00), count(*)
    into v_f_avg, v_f_count
    from public.reviews
    where freelancer_id = v_freelancer_id;

    update public.profiles
    set rating_avg = v_f_avg,
        reviews_count = v_f_count
    where id = v_freelancer_id;
  end if;

  -- Recalcular estadísticas del servicio en public.services
  if v_service_id is not null then
    select coalesce(round(avg(rating)::numeric, 2), 0.00), count(*)
    into v_s_avg, v_s_count
    from public.reviews
    where service_id = v_service_id;

    update public.services
    set rating = case when v_s_count = 0 then 5.00 else v_s_avg end,
        reviews_count = v_s_count
    where id = v_service_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_reviews_update_stats on public.reviews;
create trigger trg_reviews_update_stats
  after insert or update or delete on public.reviews
  for each row
  execute function public.update_review_stats();

-- 6. Row Level Security (RLS)
alter table public.reviews enable row level security;

-- Política de lectura: pública para todos
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all"
  on public.reviews for select
  using (true);

-- Política de inserción: solo el cliente de la orden, si la orden está aprobada o cerrada
drop policy if exists "reviews_insert_client" on public.reviews;
create policy "reviews_insert_client"
  on public.reviews for insert
  to authenticated
  with check (
    auth.uid() = client_id
    and exists (
      select 1 from public.orders o
      where o.id = order_id
        and o.client_id = auth.uid()
        and o.status in ('aprobado', 'cerrado')
    )
  );

-- Política de actualización:
-- El cliente puede editar su calificación/comentario, o el freelancer puede agregar su réplica
drop policy if exists "reviews_update_participants" on public.reviews;
create policy "reviews_update_participants"
  on public.reviews for update
  to authenticated
  using (
    auth.uid() = client_id or auth.uid() = freelancer_id
  )
  with check (
    auth.uid() = client_id or auth.uid() = freelancer_id
  );
