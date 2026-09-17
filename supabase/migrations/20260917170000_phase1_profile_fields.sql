-- ============================================================
-- Fase 1: Perfiles extendidos (freelancer), portafolio y roles
-- ============================================================

-- 1. Agregar campos a public.profiles para perfil de freelancer
alter table public.profiles
  add column if not exists headline text,
  add column if not exists bio text,
  add column if not exists hourly_rate numeric(10,2),
  add column if not exists skills text[] not null default '{}',
  add column if not exists portfolio jsonb not null default '[]'::jsonb;

comment on column public.profiles.headline is 'Título o especialidad profesional (ej: Diseñador UI/UX)';
comment on column public.profiles.bio is 'Biografía o descripción de servicios';
comment on column public.profiles.hourly_rate is 'Tarifa estimada por hora en USD';
comment on column public.profiles.skills is 'Array de etiquetas de habilidades';
comment on column public.profiles.portfolio is 'Lista JSONB de proyectos de portafolio';

-- 2. Permitir a los usuarios actualizar sus propios roles (activar/desactivar)
create policy "user_roles_update_own"
  on public.user_roles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and role in ('cliente', 'freelancer')
  );

-- 3. Permitir a los usuarios eliminar sus propios roles no requeridos
create policy "user_roles_delete_own"
  on public.user_roles for delete
  to authenticated
  using (
    auth.uid() = user_id
    and role in ('cliente', 'freelancer')
  );
