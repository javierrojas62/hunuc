-- ============================================================================
-- 0006 — Row Level Security (RLS) y permisos
-- Doble enforcement: el frontend usa RBAC; la DB es la fuente de verdad.
-- ============================================================================

alter table public.roles            enable row level security;
alter table public.branches         enable row level security;
alter table public.profiles         enable row level security;
alter table public.categories       enable row level security;
alter table public.producers        enable row level security;
alter table public.products         enable row level security;
alter table public.cash_registers   enable row level security;
alter table public.cash_movements   enable row level security;
alter table public.sales            enable row level security;
alter table public.sale_items       enable row level security;
alter table public.stock_movements  enable row level security;
alter table public.audit_logs       enable row level security;
alter table public.sessions         enable row level security;

-- ---------------- roles (catálogo de solo lectura) -------------------------
create policy roles_select on public.roles
  for select to authenticated using (true);

-- ---------------- branches --------------------------------------------------
create policy branches_select on public.branches
  for select to authenticated using (true);
create policy branches_admin_write on public.branches
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------- categories ------------------------------------------------
create policy categories_select on public.categories
  for select to authenticated using (true);
create policy categories_admin_write on public.categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------- producers -------------------------------------------------
create policy producers_select on public.producers
  for select to authenticated using (true);
create policy producers_admin_write on public.producers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------- profiles --------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- products --------------------------------------------------
-- Lectura para cualquier usuario activo; escritura solo admin.
create policy products_select on public.products
  for select to authenticated using (public.is_active_user());
create policy products_admin_write on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------- cash_registers --------------------------------------------
-- Lectura para miembros de la sucursal o admin. Escritura vía funciones RPC.
create policy cash_registers_select on public.cash_registers
  for select to authenticated
  using (public.is_admin() or branch_id = public.current_branch_id());

-- ---------------- cash_movements --------------------------------------------
create policy cash_movements_select on public.cash_movements
  for select to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.cash_registers cr
      where cr.id = cash_register_id and cr.branch_id = public.current_branch_id()
    )
  );

-- ---------------- sales -----------------------------------------------------
-- Admin ve todo; el vendedor ve solo sus ventas. Inserción vía create_sale().
create policy sales_select on public.sales
  for select to authenticated
  using (public.is_admin() or seller_id = auth.uid());
create policy sales_admin_update on public.sales
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------- sale_items ------------------------------------------------
create policy sale_items_select on public.sale_items
  for select to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and (public.is_admin() or s.seller_id = auth.uid())
    )
  );

-- ---------------- stock_movements (kardex, solo admin) ----------------------
create policy stock_movements_select on public.stock_movements
  for select to authenticated using (public.is_admin());

-- ---------------- audit_logs ------------------------------------------------
create policy audit_select on public.audit_logs
  for select to authenticated using (public.is_admin());
create policy audit_insert on public.audit_logs
  for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);

-- ---------------- sessions --------------------------------------------------
create policy sessions_select on public.sessions
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy sessions_insert on public.sessions
  for insert to authenticated with check (user_id = auth.uid());
create policy sessions_update on public.sessions
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Trigger: auditoría automática de cambios de precio en productos
-- ============================================================================
create or replace function public.audit_product_price_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.price is distinct from old.price then
    perform public.log_audit(
      'price_change', 'product', new.id::text,
      jsonb_build_object('price', old.price),
      jsonb_build_object('price', new.price)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_audit_price on public.products;
create trigger trg_audit_price
  after update of price on public.products
  for each row execute function public.audit_product_price_change();

-- ============================================================================
-- Permisos de ejecución de las funciones RPC
-- ============================================================================
grant execute on function public.create_sale(jsonb, text, numeric, text, text, text) to authenticated;
grant execute on function public.open_cash_register(numeric, text) to authenticated;
grant execute on function public.add_cash_movement(text, numeric, text, text) to authenticated;
grant execute on function public.close_cash_register(uuid, numeric, text) to authenticated;
grant execute on function public.adjust_stock(uuid, numeric, text) to authenticated;
grant execute on function public.log_audit(text, text, text, jsonb, jsonb, text, text, text, text) to authenticated;
