import { createClient } from "@/lib/supabase/client";
import type { AuditLog } from "@/types/db";

export interface AuditRow extends AuditLog {
  user: { full_name: string } | null;
}

export interface AuditFilters {
  action?: string;
  from?: string;
  page?: number;
  pageSize?: number;
}

export const AUDIT_ACTIONS = [
  { value: "login", label: "Inicio de sesión" },
  { value: "logout", label: "Cierre de sesión" },
  { value: "sale", label: "Venta" },
  { value: "sale_cancel", label: "Venta anulada" },
  { value: "price_change", label: "Cambio de precio" },
  { value: "stock_change", label: "Cambio de stock" },
  { value: "product_create", label: "Alta de producto" },
  { value: "product_delete", label: "Baja de producto" },
  { value: "products_import", label: "Importación" },
  { value: "cash_open", label: "Apertura de caja" },
  { value: "cash_close", label: "Cierre de caja" },
  { value: "cash_movement", label: "Movimiento de caja" },
];

export async function fetchAuditLogs(
  filters: AuditFilters = {},
): Promise<{ rows: AuditRow[]; count: number }> {
  const supabase = createClient();
  const { action, from, page = 1, pageSize = 30 } = filters;

  let query = supabase
    .from("audit_logs")
    .select("*, user:profiles!audit_logs_user_id_fkey(full_name)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (action) query = query.eq("action", action);
  if (from) query = query.gte("created_at", from);

  const start = (page - 1) * pageSize;
  query = query.range(start, start + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as AuditRow[], count: count ?? 0 };
}
