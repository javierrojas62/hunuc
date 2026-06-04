import { createClient } from "@/lib/supabase/client";
import type { CashRegister, CashMovement } from "@/types/db";

export interface CashSummary {
  register: CashRegister | null;
  movements: CashMovement[];
  byMethod: { efectivo: number; transferencia: number; mercado_pago: number };
  totals: { income: number; expense: number; sales: number };
  expectedCash: number;
}

const EMPTY: CashSummary = {
  register: null,
  movements: [],
  byMethod: { efectivo: 0, transferencia: 0, mercado_pago: 0 },
  totals: { income: 0, expense: 0, sales: 0 },
  expectedCash: 0,
};

/** Caja abierta actual + sus movimientos y totales calculados. */
export async function fetchCurrentCash(): Promise<CashSummary> {
  const supabase = createClient();
  const { data: register } = await supabase
    .from("cash_registers")
    .select("*")
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!register) return EMPTY;

  const { data: movements } = await supabase
    .from("cash_movements")
    .select("*")
    .eq("cash_register_id", register.id)
    .order("created_at", { ascending: false });

  const mv = movements ?? [];
  const byMethod = { efectivo: 0, transferencia: 0, mercado_pago: 0 };
  const totals = { income: 0, expense: 0, sales: 0 };

  for (const m of mv) {
    const amount = Number(m.amount);
    const method = (m.payment_method ?? "efectivo") as keyof typeof byMethod;
    if (m.type === "expense") {
      totals.expense += amount;
    } else {
      totals[m.type === "sale" ? "sales" : "income"] += amount;
      if (method in byMethod) byMethod[method] += amount;
    }
  }

  // Esperado en cajón = apertura + ingresos/ventas en efectivo - egresos en efectivo
  const cashIncome = mv
    .filter((m) => m.type !== "expense" && (m.payment_method ?? "efectivo") === "efectivo")
    .reduce((s, m) => s + Number(m.amount), 0);
  const cashExpense = mv
    .filter((m) => m.type === "expense" && (m.payment_method ?? "efectivo") === "efectivo")
    .reduce((s, m) => s + Number(m.amount), 0);
  const expectedCash = Number(register.opening_amount) + cashIncome - cashExpense;

  return { register, movements: mv, byMethod, totals, expectedCash };
}

export interface CashHistoryRow extends CashRegister {
  opened_by_profile: { full_name: string } | null;
}

export async function fetchCashHistory(): Promise<CashHistoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cash_registers")
    .select("*, opened_by_profile:profiles!cash_registers_opened_by_fkey(full_name)")
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(30);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as CashHistoryRow[];
}
