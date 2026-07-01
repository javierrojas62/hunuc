-- Normaliza códigos de barras vacíos a NULL.
-- El índice único uq_products_barcode ignora los NULL pero trata '' como un
-- valor real, por lo que dos productos con barcode '' colisionan al editar.
update public.products
  set barcode = null
  where barcode is not null and btrim(barcode) = '';
