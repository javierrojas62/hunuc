-- ============================================================================
-- 0007 — Vistas de lectura
-- security_invoker = on  → la vista respeta las políticas RLS del usuario.
-- ============================================================================

create or replace view public.products_view
with (security_invoker = on)
as
select
  p.*,
  c.name  as category_name,
  c.slug  as category_slug,
  c.color as category_color,
  pr.name as producer_name,
  (p.stock <= p.min_stock) as is_low_stock
from public.products p
left join public.categories c on c.id = p.category_id
left join public.producers  pr on pr.id = p.producer_id;
