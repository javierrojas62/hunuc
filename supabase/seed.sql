-- ============================================================================
-- SEED base — roles, sucursal por defecto y categorías normalizadas.
-- Los PRODUCTOS se cargan con el importador del Excel real (pnpm seed).
-- Idempotente: se puede correr varias veces.
-- ============================================================================

-- Roles
insert into public.roles (name, description, permissions) values
  ('admin',  'Administrador del sistema', '["all"]'::jsonb),
  ('seller', 'Vendedor / cajero',         '["pos"]'::jsonb)
on conflict (name) do nothing;

-- Sucursal por defecto
insert into public.branches (id, name, address)
values ('00000000-0000-0000-0000-000000000001', 'Casa Central', null)
on conflict (id) do nothing;

-- Categorías normalizadas (derivadas del catálogo agroecológico real)
insert into public.categories (name, slug, color) values
  ('Legumbres',            'legumbres',            '#84cc16'),
  ('Cereales y Harinas',   'cereales-harinas',     '#eab308'),
  ('Conservas y Escabeches','conservas-escabeches', '#f97316'),
  ('Aceites y Aderezos',   'aceites-aderezos',     '#f59e0b'),
  ('Endulzantes',          'endulzantes',          '#ec4899'),
  ('Yerba y Hierbas',      'yerba-hierbas',        '#22c55e'),
  ('Frutos Secos',         'frutos-secos',         '#a16207'),
  ('Lácteos y Huevos',     'lacteos-huevos',       '#fde047'),
  ('Panadería',            'panaderia',            '#d97706'),
  ('Especias y Condimentos','especias-condimentos','#ef4444'),
  ('Bebidas',              'bebidas',              '#06b6d4'),
  ('Cosmética Natural',    'cosmetica-natural',    '#a855f7'),
  ('Limpieza',             'limpieza',             '#3b82f6'),
  ('General',              'general',              '#6b7280')
on conflict (slug) do nothing;
