-- ============================================================================
-- 0002 — Tablas núcleo
-- ============================================================================

-- ----------------------------------------------------------------------------
-- roles
-- ----------------------------------------------------------------------------
create table if not exists public.roles (
  id          smallint generated always as identity primary key,
  name        text not null unique check (name in ('admin', 'seller')),
  description text,
  permissions jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- branches (multi-sucursal ready desde el día 1)
-- ----------------------------------------------------------------------------
create table if not exists public.branches (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  address    text,
  phone      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_branches_updated before update on public.branches
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- profiles (1:1 con auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null default '',
  email      text,
  phone      text,
  role_id    smallint not null references public.roles(id),
  branch_id  uuid references public.branches(id) on delete set null,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_profiles_role on public.profiles(role_id);
create index if not exists idx_profiles_branch on public.profiles(branch_id);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- categories (derivadas/normalizadas en la importación)
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  color      text not null default '#6b7280',
  icon       text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- producers (prefijo del código en el Excel: CASTA, EA, PRES, VILMA…)
-- ----------------------------------------------------------------------------
create table if not exists public.producers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code_prefix text,
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_producers_prefix on public.producers(code_prefix);

-- ----------------------------------------------------------------------------
-- products
--   * code: código del negocio. NO único (el Excel tiene colisiones).
--   * stock/min_stock: numeric para permitir fraccionados (kg).
--   * unit_value/unit_base: unidad normalizada; unit_label: original.
--   * barcode, needs_review: preparados para lector y revisión de datos.
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  code         text not null default '',
  name         text not null,
  description  text,
  category_id  uuid references public.categories(id) on delete set null,
  producer_id  uuid references public.producers(id) on delete set null,
  branch_id    uuid references public.branches(id) on delete set null,
  unit_label   text not null default 'unidad',
  unit_value   numeric(12,3),
  unit_base    text not null default 'unidad',
  price        numeric(12,2) not null default 0 check (price >= 0),
  cost         numeric(12,2) not null default 0 check (cost >= 0),
  stock        numeric(12,3) not null default 0,
  min_stock    numeric(12,3) not null default 5,
  barcode      text,
  is_active    boolean not null default true,
  needs_review boolean not null default false,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- Búsqueda instantánea: índices trigram sobre código y nombre
create index if not exists idx_products_code_trgm on public.products using gin (code gin_trgm_ops);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_producer on public.products(producer_id);
create index if not exists idx_products_branch on public.products(branch_id);
create index if not exists idx_products_active on public.products(is_active);
create unique index if not exists uq_products_barcode
  on public.products(barcode) where barcode is not null;
-- Productos con stock bajo (índice parcial, consultado seguido en dashboards)
create index if not exists idx_products_low_stock
  on public.products(stock) where is_active;
