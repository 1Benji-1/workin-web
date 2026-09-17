-- ============================================================
-- Fase 2: Servicios, Categorías y Paquetes (Marketplace)
-- ============================================================

-- 1. Tabla categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now()
);

comment on table public.categories is 'Categorías de servicios disponibles en el marketplace';

-- 2. Tabla services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  freelancer_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  delivery_days integer not null default 3,
  cover_image text,
  status text not null default 'active' check (status in ('active', 'paused', 'draft')),
  rating numeric(3,2) not null default 5.00,
  reviews_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.services is 'Servicios y ofertas profesionales publicadas por freelancers';

-- Trigger updated_at en services
create trigger services_set_updated_at
  before update on public.services
  for each row
  execute function public.set_updated_at();

-- 3. Tabla service_packages (básico, estándar, premium)
create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  tier text not null check (tier in ('basico', 'estandar', 'premium')),
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  delivery_days integer not null default 3,
  revisions integer not null default 1,
  created_at timestamptz not null default now(),
  unique (service_id, tier)
);

comment on table public.service_packages is 'Niveles de paquetes (básico, estándar, premium) para cada servicio';

-- 4. Row Level Security (RLS)
alter table public.categories enable row level security;
alter table public.services enable row level security;
alter table public.service_packages enable row level security;

-- Categories: Lectura pública para cualquier usuario (anónimo o autenticado)
create policy "categories_select_public"
  on public.categories for select
  using (true);

-- Services:
-- Lectura pública si está activo, o si el usuario autenticado es el dueño
create policy "services_select_public"
  on public.services for select
  using (status = 'active' or auth.uid() = freelancer_id);

-- Creación: Solo si el usuario es el dueño y tiene el rol 'freelancer'
create policy "services_insert_freelancer"
  on public.services for insert
  to authenticated
  with check (
    auth.uid() = freelancer_id
    and exists (
      select 1 from public.user_roles
      where user_id = auth.uid()
        and role = 'freelancer'
        and active = true
    )
  );

-- Actualización y Eliminación: Solo el freelancer dueño del servicio
create policy "services_update_own"
  on public.services for update
  to authenticated
  using (auth.uid() = freelancer_id)
  with check (auth.uid() = freelancer_id);

create policy "services_delete_own"
  on public.services for delete
  to authenticated
  using (auth.uid() = freelancer_id);

-- Service Packages:
create policy "service_packages_select_public"
  on public.service_packages for select
  using (true);

create policy "service_packages_insert_own"
  on public.service_packages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.services
      where id = service_id
        and freelancer_id = auth.uid()
    )
  );

create policy "service_packages_update_own"
  on public.service_packages for update
  to authenticated
  using (
    exists (
      select 1 from public.services
      where id = service_id
        and freelancer_id = auth.uid()
    )
  );

create policy "service_packages_delete_own"
  on public.service_packages for delete
  to authenticated
  using (
    exists (
      select 1 from public.services
      where id = service_id
        and freelancer_id = auth.uid()
    )
  );

-- 5. Semilla inicial de Categorías (Seed)
insert into public.categories (name, slug, description, icon)
values
  ('Desarrollo Web y Software', 'desarrollo-web', 'Sitios web, aplicaciones full-stack, frontend, backend y APIs.', '💻'),
  ('Diseño Gráfico y UI/UX', 'diseno-grafico', 'Diseño de interfaces, logotipos, branding, ilustraciones y prototipos en Figma.', '🎨'),
  ('Aplicaciones Móviles', 'aplicaciones-moviles', 'Apps nativas y multiplataforma en Flutter, React Native, iOS y Android.', '📱'),
  ('Marketing Digital y SEO', 'marketing-digital', 'Posicionamiento SEO, pauta digital, redes sociales y growth marketing.', '📈'),
  ('Redacción y Traducción', 'redaccion-traduccion', 'Artículos, copywriting persuasivo, traducción de documentos y corrección de estilo.', '✍️'),
  ('Video y Animación', 'video-animacion', 'Edición de video, motion graphics, intros y producción audiovisual.', '🎬')
on conflict (slug) do nothing;
