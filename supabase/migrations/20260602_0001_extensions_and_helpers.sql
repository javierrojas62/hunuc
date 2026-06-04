-- ============================================================================
-- 0001 — Extensiones y funciones helper
-- Almacén Natural Hunuc Pachacutek
-- ============================================================================

-- Búsqueda por similitud (búsqueda instantánea de productos)
create extension if not exists pg_trgm;
-- UUIDs
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Trigger genérico: mantiene updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- Helpers de autorización (SECURITY DEFINER para evitar recursión en RLS).
-- Leen el perfil del usuario autenticado bypaseando RLS.
-- ----------------------------------------------------------------------------
-- Nota: plpgsql (no sql) para diferir la resolución de nombres a runtime,
-- ya que estas funciones se crean antes que las tablas que consultan.
create or replace function public.current_role_name()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_name text;
begin
  select r.name into v_name
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = auth.uid();
  return v_name;
end;
$$;

create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return coalesce(public.current_role_name() = 'admin', false);
end;
$$;

create or replace function public.current_branch_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_branch uuid;
begin
  select branch_id into v_branch from public.profiles where id = auth.uid();
  return v_branch;
end;
$$;

create or replace function public.is_active_user()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare v_active boolean;
begin
  select is_active into v_active from public.profiles where id = auth.uid();
  return coalesce(v_active, false);
end;
$$;
