-- ============================================================================
-- Actualización masiva de productos existentes (por ID) desde el importador.
-- Permite el flujo: Exportar -> editar STOCK/PRECIO en Excel -> Reimportar.
-- Actualiza precio / stock / stock mínimo / nombre / unidad y deja kardex
-- (stock_movements) + auditoría de precio (trigger trg_audit_price).
-- Atómico y en un solo round-trip.
-- ============================================================================

create or replace function public.bulk_update_products(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item     jsonb;
  v_id       uuid;
  v_prev_stk numeric(12,3);
  v_branch   uuid;
  v_new_stk  numeric(12,3);
  v_count    integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Solo un administrador puede actualizar productos';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_id := (v_item->>'id')::uuid;
    if v_id is null then
      continue;
    end if;

    -- Bloqueo de la fila y stock previo
    select stock, branch_id into v_prev_stk, v_branch
    from public.products where id = v_id for update;
    if not found then
      continue;
    end if;

    -- Actualiza solo los campos provistos (coalesce conserva lo existente)
    update public.products p set
      name       = coalesce(nullif(v_item->>'name',''), p.name),
      unit_label = coalesce(nullif(v_item->>'unit_label',''), p.unit_label),
      price      = coalesce((v_item->>'price')::numeric, p.price),
      min_stock  = coalesce((v_item->>'min_stock')::numeric, p.min_stock),
      stock      = coalesce((v_item->>'stock')::numeric, p.stock),
      needs_review = case when (v_item->>'price') is not null
                            and (v_item->>'price')::numeric > 0
                          then false else p.needs_review end
    where p.id = v_id;

    -- Kardex + auditoría de stock si cambió
    v_new_stk := coalesce((v_item->>'stock')::numeric, v_prev_stk);
    if v_new_stk <> v_prev_stk then
      insert into public.stock_movements
        (product_id, branch_id, type, quantity, previous_stock, new_stock, reason, user_id)
      values
        (v_id, v_branch, 'adjust', v_new_stk - v_prev_stk, v_prev_stk, v_new_stk,
         'Actualización masiva (importación)', auth.uid());

      perform public.log_audit('stock_change', 'product', v_id::text,
        jsonb_build_object('stock', v_prev_stk),
        jsonb_build_object('stock', v_new_stk));
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

grant execute on function public.bulk_update_products(jsonb) to authenticated;
