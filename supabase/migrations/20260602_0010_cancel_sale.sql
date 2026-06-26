-- ============================================================================
-- 0010 — RPC cancel_sale: anula una venta de forma atómica.
--
-- Efectos:
--   1. Marca la venta como 'cancelled'.
--   2. Restituye el stock de cada ítem con kardex.
--   3. Registra un movimiento de caja inverso (expense) en la misma caja.
--   4. Escribe auditoría.
-- Solo admin puede cancelar. No se puede cancelar una venta ya cancelada.
-- ============================================================================

create or replace function public.cancel_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale     record;
  v_item     record;
  v_prev_stk numeric(12,3);
  v_branch   uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede cancelar ventas';
  end if;

  -- Bloquear la fila para evitar doble cancelación concurrente
  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'Venta inexistente';
  end if;
  if v_sale.status = 'cancelled' then
    raise exception 'La venta ya está cancelada';
  end if;

  -- 1. Marcar como cancelada
  update public.sales set status = 'cancelled' where id = p_sale_id;

  -- 2. Restituir stock ítem por ítem con kardex
  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    continue when v_item.product_id is null;

    select stock, branch_id into v_prev_stk, v_branch
    from public.products where id = v_item.product_id for update;
    continue when not found;

    update public.products
    set stock = stock + v_item.quantity
    where id = v_item.product_id;

    insert into public.stock_movements
      (product_id, branch_id, type, quantity, previous_stock, new_stock, reason, reference_id, user_id)
    values
      (v_item.product_id, coalesce(v_branch, v_sale.branch_id),
       'in', v_item.quantity, v_prev_stk, v_prev_stk + v_item.quantity,
       'Anulación Venta #' || v_sale.ticket_number, p_sale_id, auth.uid());
  end loop;

  -- 3. Movimiento inverso en la caja (registra la devolución para el arqueo)
  if v_sale.cash_register_id is not null then
    insert into public.cash_movements
      (cash_register_id, type, amount, concept, payment_method, reference_id, user_id)
    values
      (v_sale.cash_register_id, 'expense', v_sale.total,
       'Anulación Venta #' || v_sale.ticket_number,
       v_sale.payment_method, p_sale_id, auth.uid());
  end if;

  -- 4. Auditoría
  perform public.log_audit('sale_cancel', 'sale', p_sale_id::text,
    jsonb_build_object('status', 'completed', 'total', v_sale.total),
    jsonb_build_object('status', 'cancelled'));
end;
$$;

grant execute on function public.cancel_sale(uuid) to authenticated;
