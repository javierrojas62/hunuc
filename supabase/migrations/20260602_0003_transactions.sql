-- ============================================================================
-- 0003 — Tablas transaccionales: caja, ventas, ítems y movimientos de stock
-- ============================================================================

-- Secuencia para número de ticket legible
create sequence if not exists public.sales_ticket_seq start 1;

-- ----------------------------------------------------------------------------
-- cash_registers (sesiones de caja: apertura/cierre/arqueo)
-- ----------------------------------------------------------------------------
create table if not exists public.cash_registers (
  id              uuid primary key default gen_random_uuid(),
  branch_id       uuid not null references public.branches(id),
  status          text not null default 'open' check (status in ('open','closed')),
  opening_amount  numeric(12,2) not null default 0,
  closing_amount  numeric(12,2),            -- contado en el arqueo
  expected_amount numeric(12,2),            -- calculado por el sistema
  difference      numeric(12,2),            -- closing - expected
  opened_by       uuid not null references public.profiles(id),
  closed_by       uuid references public.profiles(id),
  opened_at       timestamptz not null default now(),
  closed_at       timestamptz,
  notes           text
);
create index if not exists idx_cash_registers_branch on public.cash_registers(branch_id);
create index if not exists idx_cash_registers_status on public.cash_registers(status);
-- Solo una caja abierta por sucursal a la vez
create unique index if not exists uq_open_register_per_branch
  on public.cash_registers(branch_id) where status = 'open';

-- ----------------------------------------------------------------------------
-- sales (cabecera de venta)
-- ----------------------------------------------------------------------------
create table if not exists public.sales (
  id               uuid primary key default gen_random_uuid(),
  ticket_number    bigint not null default nextval('public.sales_ticket_seq'),
  branch_id        uuid not null references public.branches(id),
  cash_register_id uuid references public.cash_registers(id),
  seller_id        uuid not null references public.profiles(id),
  subtotal         numeric(12,2) not null default 0,
  discount         numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,
  payment_method   text not null check (payment_method in ('efectivo','transferencia','mercado_pago')),
  status           text not null default 'completed' check (status in ('completed','cancelled')),
  note             text,
  created_at       timestamptz not null default now()
);
create index if not exists idx_sales_seller on public.sales(seller_id);
create index if not exists idx_sales_branch on public.sales(branch_id);
create index if not exists idx_sales_register on public.sales(cash_register_id);
create index if not exists idx_sales_created on public.sales(created_at desc);
create index if not exists idx_sales_payment on public.sales(payment_method);

-- ----------------------------------------------------------------------------
-- sale_items (detalle; snapshot de nombre/código/precio al momento de venta)
-- ----------------------------------------------------------------------------
create table if not exists public.sale_items (
  id            uuid primary key default gen_random_uuid(),
  sale_id       uuid not null references public.sales(id) on delete cascade,
  product_id    uuid references public.products(id) on delete set null,
  product_code  text,
  product_name  text not null,
  quantity      numeric(12,3) not null check (quantity > 0),
  unit_price    numeric(12,2) not null,
  subtotal      numeric(12,2) not null
);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);

-- ----------------------------------------------------------------------------
-- stock_movements (kardex)
--   reference_id: uuid genérico (venta, importación, ajuste). Sin FK rígida.
-- ----------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id             uuid primary key default gen_random_uuid(),
  product_id     uuid not null references public.products(id) on delete cascade,
  branch_id      uuid references public.branches(id),
  type           text not null check (type in ('in','out','adjust','sale')),
  quantity       numeric(12,3) not null,
  previous_stock numeric(12,3),
  new_stock      numeric(12,3),
  reason         text,
  reference_id   uuid,
  user_id        uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_stock_mov_product on public.stock_movements(product_id);
create index if not exists idx_stock_mov_created on public.stock_movements(created_at desc);
create index if not exists idx_stock_mov_type on public.stock_movements(type);

-- ----------------------------------------------------------------------------
-- cash_movements (ingresos/egresos/ventas sobre una caja)
-- ----------------------------------------------------------------------------
create table if not exists public.cash_movements (
  id               uuid primary key default gen_random_uuid(),
  cash_register_id uuid not null references public.cash_registers(id) on delete cascade,
  type             text not null check (type in ('income','expense','sale')),
  amount           numeric(12,2) not null check (amount >= 0),
  concept          text,
  payment_method   text check (payment_method in ('efectivo','transferencia','mercado_pago')),
  reference_id     uuid,  -- sale_id cuando type='sale'
  user_id          uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);
create index if not exists idx_cash_mov_register on public.cash_movements(cash_register_id);
create index if not exists idx_cash_mov_type on public.cash_movements(type);
create index if not exists idx_cash_mov_created on public.cash_movements(created_at desc);
