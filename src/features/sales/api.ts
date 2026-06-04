import { createClient } from "@/lib/supabase/client";
import type { Sale, SaleItem } from "@/types/db";

export interface SaleListRow extends Sale {
  seller: { full_name: string } | null;
  items_count: number;
}

export interface SaleListFilters {
  from?: string;
  to?: string;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchSales(
  filters: SaleListFilters = {},
): Promise<{ rows: SaleListRow[]; count: number }> {
  const supabase = createClient();
  const { from, to, paymentMethod, page = 1, pageSize = 25 } = filters;

  let query = supabase
    .from("sales")
    .select("*, seller:profiles!sales_seller_id_fkey(full_name), sale_items(count)", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (paymentMethod) query = query.eq("payment_method", paymentMethod);

  const start = (page - 1) * pageSize;
  query = query.range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((s) => {
    const { sale_items, seller, ...rest } = s as Record<string, unknown> & {
      sale_items: { count: number }[];
      seller: { full_name: string } | null;
    };
    return {
      ...(rest as unknown as Sale),
      seller,
      items_count: sale_items?.[0]?.count ?? 0,
    } as SaleListRow;
  });

  return { rows, count: count ?? 0 };
}

export interface SaleDetail extends Sale {
  seller: { full_name: string } | null;
  items: SaleItem[];
}

export async function fetchSaleDetail(id: string): Promise<SaleDetail> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sales")
    .select("*, seller:profiles!sales_seller_id_fkey(full_name), items:sale_items(*)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as SaleDetail;
}

/** Ventas de hoy (para el dashboard del vendedor). */
export async function fetchTodaySales(): Promise<{
  total: number;
  count: number;
  rows: SaleListRow[];
}> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const { rows, count } = await fetchSales({ from: start.toISOString(), pageSize: 100 });
  const total = rows
    .filter((r) => r.status === "completed")
    .reduce((s, r) => s + Number(r.total), 0);
  return { total, count, rows };
}
