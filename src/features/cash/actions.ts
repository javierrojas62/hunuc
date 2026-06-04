"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";

export interface CashResult {
  ok: boolean;
  error?: string;
  data?: unknown;
}

export async function openCashAction(
  opening: number,
  notes?: string,
): Promise<CashResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("open_cash_register", {
    p_opening: opening,
    p_notes: notes,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cash");
  return { ok: true, data };
}

export async function addCashMovementAction(
  type: "income" | "expense",
  amount: number,
  concept?: string,
  paymentMethod = "efectivo",
): Promise<CashResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_cash_movement", {
    p_type: type,
    p_amount: amount,
    p_concept: concept,
    p_payment_method: paymentMethod,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cash");
  return { ok: true, data };
}

export async function closeCashAction(
  registerId: string,
  counted: number,
  notes?: string,
): Promise<CashResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("close_cash_register", {
    p_register: registerId,
    p_counted: counted,
    p_notes: notes,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/cash");
  return { ok: true, data };
}
