-- ============================================================================
-- 0004 — Auditoría, sesiones y alta automática de perfiles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,
  action     text not null,            -- 'login','price_change','sale','stock_change','cash_open'…
  entity     text,                     -- 'product','sale','cash_register'…
  entity_id  text,
  old_data   jsonb,
  new_data   jsonb,
  ip         text,
  user_agent text,
  device     text,
  browser    text,
  branch_id  uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_user on public.audit_logs(user_id);
create index if not exists idx_audit_action on public.audit_logs(action);
create index if not exists idx_audit_entity on public.audit_logs(entity, entity_id);
create index if not exists idx_audit_created on public.audit_logs(created_at desc);

-- ----------------------------------------------------------------------------
-- sessions (registro de inicios de sesión / dispositivos)
-- ----------------------------------------------------------------------------
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  ip         text,
  user_agent text,
  device     text,
  browser    text,
  login_at   timestamptz not null default now(),
  logout_at  timestamptz
);
create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_login on public.sessions(login_at desc);

-- ----------------------------------------------------------------------------
-- Helper para escribir auditoría desde funciones (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
create or replace function public.log_audit(
  p_action    text,
  p_entity    text default null,
  p_entity_id text default null,
  p_old       jsonb default null,
  p_new       jsonb default null,
  p_ip        text default null,
  p_user_agent text default null,
  p_device    text default null,
  p_browser   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs(
    user_id, action, entity, entity_id, old_data, new_data,
    ip, user_agent, device, browser, branch_id
  ) values (
    auth.uid(), p_action, p_entity, p_entity_id, p_old, p_new,
    p_ip, p_user_agent, p_device, p_browser, public.current_branch_id()
  )
  returning id into v_id;
  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- Alta automática de perfil al crear un usuario en auth.users.
-- Rol por defecto: seller. El admin puede promover luego.
-- Metadatos opcionales: full_name, role, branch_id en raw_user_meta_data.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role_id   smallint;
  v_role_name text;
begin
  v_role_name := coalesce(new.raw_user_meta_data->>'role', 'seller');
  select id into v_role_id from public.roles where name = v_role_name;
  if v_role_id is null then
    select id into v_role_id from public.roles where name = 'seller';
  end if;

  insert into public.profiles (id, full_name, email, role_id, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    v_role_id,
    nullif(new.raw_user_meta_data->>'branch_id','')::uuid
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
