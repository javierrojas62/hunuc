-- ============================================================================
-- ARREGLO: asignar sucursal por defecto a los perfiles que no tienen.
-- Correr en Supabase → SQL Editor. Es idempotente (se puede repetir).
-- ============================================================================

-- 1) Asegurar que exista la sucursal por defecto (por si no se corrió el seed)
insert into public.branches (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Casa Central')
on conflict (id) do nothing;

-- 2) Asignar esa sucursal a todo perfil que esté sin sucursal (tu admin incluido)
update public.profiles
set branch_id = '00000000-0000-0000-0000-000000000001'
where branch_id is null;

-- 3) (Verificación) ver tu perfil con su rol y sucursal
select p.email, r.name as rol, b.name as sucursal
from public.profiles p
left join public.roles r on r.id = p.role_id
left join public.branches b on b.id = p.branch_id;
