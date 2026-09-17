-- ============================================================
-- Fase 0: Schema inicial — profiles, roles y RLS base
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tipos
-- ------------------------------------------------------------
create type public.role_type as enum ('cliente', 'freelancer', 'admin', 'soporte');

-- ------------------------------------------------------------
-- 2. Tabla profiles
-- Espejo de auth.users con los datos propios de la app.
-- id = mismo uuid que auth.users.id (relación 1 a 1).
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos de perfil de cada usuario, 1 a 1 con auth.users';

-- ------------------------------------------------------------
-- 3. Tabla user_roles
-- Relación muchos a muchos: una cuenta puede tener varios roles
-- (ej: cliente + freelancer a la vez).
-- ------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.role_type not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is 'Roles activos por usuario. Un usuario puede tener varias filas (cliente y freelancer a la vez)';

-- ------------------------------------------------------------
-- 4. Trigger: updated_at automático en profiles
-- ------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Trigger: crear profile automáticamente al registrarse
-- Se ejecuta con privilegios elevados (security definer) porque
-- corre sobre auth.users, que el usuario no puede escribir directo.
-- ------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');

  -- Rol "cliente" por defecto al registrarse.
  -- El rol "freelancer" se activa después, desde el perfil (Fase 1).
  insert into public.user_roles (user_id, role)
  values (new.id, 'cliente');

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 6. Row Level Security
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

-- profiles: cualquier usuario autenticado puede LEER cualquier perfil
-- (necesario para el marketplace: ver perfiles de freelancers públicamente).
-- Ajustaremos esto en Fase 2 si hace falta ocultar campos sensibles.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- profiles: cada usuario solo puede editar SU PROPIO perfil
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- user_roles: cada usuario ve solo sus propios roles
create policy "user_roles_select_own"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- user_roles: un usuario puede auto-asignarse SOLO 'cliente' o 'freelancer'.
-- 'admin' y 'soporte' quedan bloqueados: esos se asignan a mano
-- desde el dashboard de Supabase o con service_role, nunca desde el cliente.
create policy "user_roles_insert_own_limited"
  on public.user_roles for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and role in ('cliente', 'freelancer')
  );

