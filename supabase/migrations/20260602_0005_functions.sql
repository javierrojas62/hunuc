-- ============================================================================
-- 0005 — Funciones de negocio (RPC) atómicas
-- ============================================================================

-- ----------------------------------------------------------------------------
-- create_sale: registra una venta completa de forma atómica.
--   p_items: jsonb array [{ "product_id": uuid, "quantity": num, "unit_price": num }]
-- Efectos: inserta sale + sale_items, descuenta stock, escribe kardex,
--          registra movimiento de caja y auditoría. Devuelve {id, ticket_number}.
-- ----------------------------------------------------------------------------
create or replace function public.create_sale(
  p_items          jsonb,
  p_payment_method text,
  p_discount       numeric default 0,
  p_note           text default null,
  p_ip             text default null,
  p_user_agent     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch    uuid := public.current_branch_id();
  v_register  uuid;
  v_sale_id   uuid;
  v_ticket    bigint;
  v_subtotal  numeric(12,2) := 0;
  v_total     numeric(12,2);
  v_item      jsonb;
  v_pid       uuid;
  v_qty       numeric(12,3);
  v_price     numeric(12,2);
  v_prev      numeric(12,3);
  v_name      text;
  v_code      text;
begin
  if not public.is_active_user() then
    raise exception 'Usuario inactivo o no autenticado';
  end if;
  if v_branch is null then
    raise exception 'El usuario no tiene sucursal asignada';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'La venta no tiene ítems';
  end if;
  if p_payment_method not in ('efectivo','transferencia','mercado_pago') then
    raise exception 'Método de pago inválido: %', p_payment_method;
  end if;

  -- Requiere caja abierta en la sucursal
  select id into v_register
  from public.cash_registers
  where branch_id = v_branch and status = 'open'
  limit 1;
  if v_register is null then
    raise exception 'No hay una caja abierta en la sucursal';
  end if;

  insert into public.sales (branch_id, cash_register_id, seller_id, payment_method, note, discount, subtotal, total)
  values (v_branch, v_register, auth.uid(), p_payment_method, p_note, coalesce(p_discount,0), 0, 0)
  returning id, ticket_number into v_sale_id, v_ticket;

  -- Procesar cada ítem
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid   := (v_item->>'product_id')::uuid;
    v_qty   := (v_item->>'quantity')::numeric;
    v_price := (v_item->>'unit_price')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Cantidad inválida para el producto %', v_pid;
    end if;

    -- Lock de la fila del producto para consistencia de stock
    select stock, name, code into v_prev, v_name, v_code
    from public.products where id = v_pid for update;
    if not found then
      raise exception 'Producto inexistente: %', v_pid;
    end if;
    if v_prev < v_qty then
      raise exception 'Stock insuficiente de "%": disponible %, solicitado %', v_name, v_prev, v_qty;
    end if;

    insert into public.sale_items (sale_id, product_id, product_code, product_name, quantity, unit_price, subtotal)
    values (v_sale_id, v_pid, v_code, v_name, v_qty, v_price, v_qty * v_price);

    update public.products set stock = stock - v_qty where id = v_pid;

    insert into public.stock_movements (product_id, branch_id, type, quantity, previous_stock, new_stock, reason, reference_id, user_id)
    values (v_pid, v_branch, 'sale', -v_qty, v_prev, v_prev - v_qty, 'Venta #' || v_ticket, v_sale_id, auth.uid());

    v_subtotal := v_subtotal + (v_qty * v_price);
  end loop;

  v_total := v_subtotal - coalesce(p_discount,0);
  if v_total < 0 then v_total := 0; end if;

  update public.sales set subtotal = v_subtotal, total = v_total where id = v_sale_id;

  -- Movimiento de caja por la venta
  insert into public.cash_movements (cash_register_id, type, amount, concept, payment_method, reference_id, user_id)
  values (v_register, 'sale', v_total, 'Venta #' || v_ticket, p_payment_method, v_sale_id, auth.uid());

  perform public.log_audit(
    'sale', 'sale', v_sale_id::text, null,
    jsonb_build_object('ticket', v_ticket, 'total', v_total, 'payment_method', p_payment_method, 'items', jsonb_array_length(p_items)),
    p_ip, p_user_agent
  );

  return jsonb_build_object('id', v_sale_id, 'ticket_number', v_ticket, 'total', v_total);
end;
$$;

-- ----------------------------------------------------------------------------
-- open_cash_register (solo admin)
-- ----------------------------------------------------------------------------
create or replace function public.open_cash_register(
  p_opening numeric,
  p_notes   text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch uuid := public.current_branch_id();
  v_id     uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede abrir la caja';
  end if;
  if v_branch is null then
    raise exception 'El usuario no tiene sucursal asignada';
  end if;
  if exists (select 1 from public.cash_registers where branch_id = v_branch and status = 'open') then
    raise exception 'Ya existe una caja abierta en la sucursal';
  end if;

  insert into public.cash_registers (branch_id, opening_amount, opened_by, notes)
  values (v_branch, coalesce(p_opening,0), auth.uid(), p_notes)
  returning id into v_id;

  perform public.log_audit('cash_open', 'cash_register', v_id::text, null,
    jsonb_build_object('opening_amount', p_opening));
  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- add_cash_movement: ingreso/egreso manual (solo admin)
-- ----------------------------------------------------------------------------
create or replace function public.add_cash_movement(
  p_type           text,
  p_amount         numeric,
  p_concept        text default null,
  p_payment_method text default 'efectivo'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch   uuid := public.current_branch_id();
  v_register uuid;
  v_id       uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede registrar movimientos de caja';
  end if;
  if p_type not in ('income','expense') then
    raise exception 'Tipo de movimiento inválido: %', p_type;
  end if;

  select id into v_register from public.cash_registers
  where branch_id = v_branch and status = 'open' limit 1;
  if v_register is null then
    raise exception 'No hay una caja abierta en la sucursal';
  end if;

  insert into public.cash_movements (cash_register_id, type, amount, concept, payment_method, user_id)
  values (v_register, p_type, abs(coalesce(p_amount,0)), p_concept, p_payment_method, auth.uid())
  returning id into v_id;

  perform public.log_audit('cash_movement', 'cash_movement', v_id::text, null,
    jsonb_build_object('type', p_type, 'amount', p_amount, 'concept', p_concept));
  return v_id;
end;
$$;

-- ----------------------------------------------------------------------------
-- close_cash_register: arqueo y cierre (solo admin)
--   Esperado del cajón = apertura + ingresos efectivo + ventas efectivo − egresos efectivo
-- ----------------------------------------------------------------------------
create or replace function public.close_cash_register(
  p_register uuid,
  p_counted  numeric,
  p_notes    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_opening  numeric(12,2);
  v_expected numeric(12,2);
  v_diff     numeric(12,2);
  v_status   text;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cerrar la caja';
  end if;

  select opening_amount, status into v_opening, v_status
  from public.cash_registers where id = p_register for update;
  if not found then
    raise exception 'Caja inexistente';
  end if;
  if v_status = 'closed' then
    raise exception 'La caja ya está cerrada';
  end if;

  select v_opening
    + coalesce(sum(amount) filter (where type in ('income','sale') and coalesce(payment_method,'efectivo') = 'efectivo'), 0)
    - coalesce(sum(amount) filter (where type = 'expense' and coalesce(payment_method,'efectivo') = 'efectivo'), 0)
  into v_expected
  from public.cash_movements where cash_register_id = p_register;

  v_diff := coalesce(p_counted,0) - v_expected;

  update public.cash_registers
  set status = 'closed',
      closing_amount = coalesce(p_counted,0),
      expected_amount = v_expected,
      difference = v_diff,
      closed_by = auth.uid(),
      closed_at = now(),
      notes = coalesce(p_notes, notes)
  where id = p_register;

  perform public.log_audit('cash_close', 'cash_register', p_register::text, null,
    jsonb_build_object('expected', v_expected, 'counted', p_counted, 'difference', v_diff));

  return jsonb_build_object('expected', v_expected, 'counted', coalesce(p_counted,0), 'difference', v_diff);
end;
$$;

-- ----------------------------------------------------------------------------
-- adjust_stock: ajuste manual de stock (solo admin) con kardex
-- ----------------------------------------------------------------------------
create or replace function public.adjust_stock(
  p_product_id uuid,
  p_new_stock  numeric,
  p_reason     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev   numeric(12,3);
  v_branch uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede ajustar stock';
  end if;

  select stock, branch_id into v_prev, v_branch from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Producto inexistente';
  end if;

  update public.products set stock = p_new_stock where id = p_product_id;

  insert into public.stock_movements (product_id, branch_id, type, quantity, previous_stock, new_stock, reason, user_id)
  values (p_product_id, v_branch, 'adjust', p_new_stock - v_prev, v_prev, p_new_stock,
          coalesce(p_reason, 'Ajuste manual'), auth.uid());

  perform public.log_audit('stock_change', 'product', p_product_id::text,
    jsonb_build_object('stock', v_prev), jsonb_build_object('stock', p_new_stock));
end;
$$;
