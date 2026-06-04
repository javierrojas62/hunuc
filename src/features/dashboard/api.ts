import { createClient } from "@/lib/supabase/client";
import type { ProductViewRow } from "@/features/products/api";

export interface DashboardMetrics {
  sales_count: number;
  sales_total: number;
  avg_ticket: number;
  by_payment: Record<string, number>;
}

export async function fetchMetrics(range: string): Promise<DashboardMetrics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("dashboard_metrics", { p_range: range });
  if (error) throw new Error(error.message);
  return data as unknown as DashboardMetrics;
}

export interface DailyPoint {
  day: string;
  total: number;
  count: number;
}

export async function fetchDailySeries(days = 14): Promise<DailyPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("sales_daily_series", { p_days: days });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    day: d.day as string,
    total: Number(d.total),
    count: Number(d.count),
  }));
}

export interface TopProduct {
  product_id: string | null;
  product_name: string;
  qty: number;
  total: number;
}

export async function fetchTopProducts(days = 30, limit = 5): Promise<TopProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("top_products", { p_days: days, p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    product_id: p.product_id,
    product_name: p.product_name,
    qty: Number(p.qty),
    total: Number(p.total),
  }));
}

export interface TopSeller {
  seller_id: string;
  full_name: string;
  sales_count: number;
  total: number;
}

export async function fetchTopSellers(days = 30): Promise<TopSeller[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("top_sellers", { p_days: days });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    seller_id: s.seller_id,
    full_name: s.full_name,
    sales_count: Number(s.sales_count),
    total: Number(s.total),
  }));
}

export async function fetchLowStock(limit = 50): Promise<ProductViewRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products_view")
    .select("*")
    .eq("is_active", true)
    .eq("is_low_stock", true)
    .order("stock", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ProductViewRow[];
}
