-- ============================================================================
-- LIMPIEZA DE PRODUCTOS DUPLICADOS
-- Correr en Supabase -> SQL Editor. Idempotente (se puede repetir sin daño).
--
-- Contexto: importaciones previas SIN la columna ID insertaron cada producto
-- varias veces (la mayoría x3). Este script deja UNA sola copia por producto
-- y elimina las sobrantes, SIN perder ventas ni kardex.
--
-- Criterio de agrupación: mismo CÓDIGO + mismo NOMBRE (normalizados).
-- Sobreviviente del grupo: la copia con más ventas; si empatan, la que tenga
-- más movimientos de stock; si empatan, la más antigua.
--
-- Antes de borrar, las referencias (sale_items y stock_movements) de las copias
-- se "repuntan" hacia la copia sobreviviente, así el historial queda intacto.
-- ============================================================================

-- 0) VISTA PREVIA (no modifica nada): cuántas filas hay y cuántas se borrarían
select
  count(*)                                            as total_productos,
  count(*) filter (where is_active)                   as activos,
  count(distinct (coalesce(lower(btrim(code)),'') || '|' || lower(btrim(name)))) as productos_unicos,
  count(*) - count(distinct (coalesce(lower(btrim(code)),'') || '|' || lower(btrim(name)))) as a_borrar
from public.products;

-- ----------------------------------------------------------------------------
-- 1) DEDUP (transacción atómica)
-- ----------------------------------------------------------------------------
begin;

-- Mapa: cada copia duplicada -> id de la copia que se conserva
create temporary table _dedup_map on commit drop as
with ranked as (
  select
    p.id,
    coalesce(lower(btrim(p.code)), '') as gcode,
    lower(btrim(p.name))               as gname,
    (select count(*) from public.sale_items     si where si.product_id = p.id) as sales_cnt,
    (select count(*) from public.stock_movements sm where sm.product_id = p.id) as mov_cnt,
    p.created_at
  from public.products p
),
chosen as (
  select
    id,
    first_value(id) over (
      partition by gcode, gname
      order by sales_cnt desc, mov_cnt desc, created_at asc, id
    ) as keep_id
  from ranked
)
select id as dup_id, keep_id
from chosen
where id <> keep_id;

-- Repuntar las ventas de las copias hacia la copia que se conserva
update public.sale_items si
set product_id = m.keep_id
from _dedup_map m
where si.product_id = m.dup_id;

-- Repuntar el kardex de las copias hacia la copia que se conserva
update public.stock_movements sm
set product_id = m.keep_id
from _dedup_map m
where sm.product_id = m.dup_id;

-- Borrar las copias sobrantes (ya sin referencias)
delete from public.products p
using _dedup_map m
where p.id = m.dup_id;

commit;

-- ----------------------------------------------------------------------------
-- 2) VERIFICACIÓN (debería dar a_borrar = 0)
-- ----------------------------------------------------------------------------
select
  count(*)                                            as total_productos,
  count(distinct (coalesce(lower(btrim(code)),'') || '|' || lower(btrim(name)))) as productos_unicos,
  count(*) - count(distinct (coalesce(lower(btrim(code)),'') || '|' || lower(btrim(name)))) as a_borrar
from public.products;
