import { z } from "zod";

export const productSchema = z.object({
  code: z.string().trim().max(64).optional().default(""),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  description: z.string().trim().max(500).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  producer_id: z.string().uuid().optional().nullable(),
  unit_label: z.string().trim().min(1, "La unidad es obligatoria").max(40).default("Unidad"),
  unit_value: z.coerce.number().nonnegative().optional().nullable(),
  unit_base: z.string().default("unidad"),
  price: z.coerce.number({ message: "Precio inválido" }).nonnegative("El precio no puede ser negativo"),
  cost: z.coerce.number().nonnegative().optional().default(0),
  stock: z.coerce.number().min(0, "El stock no puede ser negativo").default(0),
  min_stock: z.coerce.number().min(0).default(5),
  barcode: z.string().trim().max(64).optional().nullable(),
  is_active: z.boolean().default(true),
});

export type ProductInput = z.infer<typeof productSchema>;

export const stockAdjustSchema = z.object({
  product_id: z.string().uuid(),
  new_stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
  reason: z.string().trim().max(200).optional(),
});
export type StockAdjustInput = z.infer<typeof stockAdjustSchema>;

export const productFiltersSchema = z.object({
  search: z.string().optional().default(""),
  categoryId: z.string().optional(),
  producerId: z.string().optional(),
  lowStock: z.boolean().optional(),
  inactive: z.boolean().optional(),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(100).optional().default(20),
});
export type ProductFilters = z.infer<typeof productFiltersSchema>;
