-- ============================================================================
-- 0008 — Funciones de métricas para dashboards (agregaciones server-side)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- dashboard_metrics: KPIs según rango ('today' | '7d' | '30d').
-- El vendedor ve sus propios números; el admin ve los de la sucursal.
-- ----------------------------------------------------------------------------
create or replace function public.dashboard_metrics(p_range text default 'today')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_from   timestamptz;
  v_admin  boolean := public.is_admin();
  v_uid    uuid := auth.uid();
  v_branch uuid := public.current_branch_id();
  v_result jsonb;
begin
  v_from := case p_range
    when '7d'  then now() - interval '7 days'
    when '30d' then now() - interval '30 days'
    else date_trunc('day', now())
  end;

  with scoped as (
    select s.*
    from public.sales s
    where s.created_at >= v_from
      and s.status = 'completed'
      and s.branch_id = v_branch
      and (v_admin or s.seller_id = v_uid)
  )
  select jsonb_build_object(
    'sales_count', (select count(*) from scoped),
    'sales_total', (select coalesce(sum(total),0) from scoped),
    'avg_ticket',  (select coalesce(avg(total),0) from scoped),
    'by_payment', (
      select coalesce(jsonb_object_agg(payment_method, t), '{}'::jsonb)
      from (select payment_method, sum(total) t from scoped group by payment_method) q
    )
  ) into v_result;

  return v_result;
end;
$$;

-- ----------------------------------------------------------------------------
-- sales_daily_series: serie diaria para gráficos (últimos N días).
-- ----------------------------------------------------------------------------
create or replace function public.sales_daily_series(p_days int default 14)
returns table(day date, total numeric, count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(
      date_trunc('day', now()) - make_interval(days => p_days - 1),
      date_trunc('day', now()),
      interval '1 day'
    )::date as day
  )
  select d.day,
         coalesce(sum(s.total), 0) as total,
         count(s.id) as count
  from days d
  left join public.sales s
    on date_trunc('day', s.created_at)::date = d.day
   and s.status = 'completed'
   and s.branch_id = public.current_branch_id()
   and (public.is_admin() or s.seller_id = auth.uid())
  group by d.day
  order by d.day;
$$;

-- ----------------------------------------------------------------------------
-- top_products: productos más vendidos en el rango.
-- ----------------------------------------------------------------------------
create or replace function public.top_products(p_days int default 30, p_limit int default 5)
returns table(product_id uuid, product_name text, qty numeric, total numeric)
language sql
stable
security definer
set search_path = public
as $$
  select si.product_id, si.product_name,
         sum(si.quantity) as qty,
         sum(si.subtotal) as total
  from public.sale_items si
  join public.sales s on s.id = si.sale_id
  where s.created_at >= now() - make_interval(days => p_days)
    and s.status = 'completed'
    and s.branch_id = public.current_branch_id()
    and (public.is_admin() or s.seller_id = auth.uid())
  group by si.product_id, si.product_name
  order by qty desc
  limit p_limit;
$$;

-- ----------------------------------------------------------------------------
-- top_sellers: ranking de vendedores (solo admin lo usa).
-- ----------------------------------------------------------------------------
create or replace function public.top_sellers(p_days int default 30)
returns table(seller_id uuid, full_name text, sales_count bigint, total numeric)
language sql
stable
security definer
set search_path = public
as $$
  select s.seller_id, p.full_name, count(*) as sales_count, sum(s.total) as total
  from public.sales s
  join public.profiles p on p.id = s.seller_id
  where s.created_at >= now() - make_interval(days => p_days)
    and s.status = 'completed'
    and s.branch_id = public.current_branch_id()
  group by s.seller_id, p.full_name
  order by total desc;
$$;

grant execute on function public.dashboard_metrics(text) to authenticated;
grant execute on function public.sales_daily_series(int) to authenticated;
grant execute on function public.top_products(int, int) to authenticated;
grant execute on function public.top_sellers(int) to authenticated;
