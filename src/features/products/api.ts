import { createClient } from "@/lib/supabase/client";
import type { Product, Category, Producer } from "@/types/db";
import type { ProductFilters } from "./schemas";

/** Fila de la vista products_view (producto + relaciones + flag de stock bajo). */
export interface ProductViewRow extends Product {
  category_name: string | null;
  category_slug: string | null;
  category_color: string | null;
  producer_name: string | null;
  is_low_stock: boolean;
}

export interface ProductListResult {
  rows: ProductViewRow[];
  count: number;
}

export async function fetchProducts(
  filters: ProductFilters,
): Promise<ProductListResult> {
  const supabase = createClient();
  const {
    search = "",
    categoryId,
    producerId,
    lowStock,
    inactive,
    page = 1,
    pageSize = 20,
  } = filters;

  let query = supabase
    .from("products_view")
    .select("*", { count: "exact" });

  if (!inactive) query = query.eq("is_active", true);
  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`name.ilike.${term},code.ilike.${term},barcode.ilike.${term}`);
  }
  if (categoryId) query = query.eq("category_id", categoryId);
  if (producerId) query = query.eq("producer_id", producerId);
  if (lowStock) query = query.eq("is_low_stock", true);

  const from = (page - 1) * pageSize;
  query = query.order("name", { ascending: true }).range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as ProductViewRow[], count: count ?? 0 };
}

/** Búsqueda rápida para el POS / paleta de comandos (acotada). */
export async function quickSearchProducts(term: string): Promise<ProductViewRow[]> {
  if (!term.trim()) return [];
  const supabase = createClient();
  const t = `%${term.trim()}%`;
  const { data, error } = await supabase
    .from("products_view")
    .select("*")
    .eq("is_active", true)
    .or(`name.ilike.${t},code.ilike.${t},barcode.ilike.${t}`)
    .order("name")
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductViewRow[];
}

export interface ProductExportRow {
  id: string;
  code: string | null;
  name: string;
  unit_label: string;
  price: number;
  stock: number;
  min_stock: number;
}

/** Trae todos los productos (campos editables) para exportar a Excel. */
export async function fetchAllProductsForExport(
  includeInactive = false,
): Promise<ProductExportRow[]> {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select("id, code, name, unit_label, price, stock, min_stock")
    .order("name", { ascending: true })
    .limit(10000);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductExportRow[];
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchProducers(): Promise<Producer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("producers")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}
