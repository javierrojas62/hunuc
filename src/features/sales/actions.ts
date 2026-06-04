"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser, requireAdmin } from "@/lib/auth/session";
import { getClientIp } from "@/lib/user-agent";
import { createSaleSchema } from "./schemas";

export interface CreateSaleResult {
  ok: boolean;
  error?: string;
  ticketNumber?: number;
  total?: number;
}

export async function createSaleAction(input: unknown): Promise<CreateSaleResult> {
  await requireUser();
  const parsed = createSaleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const h = await headers();
  const ua = h.get("user-agent");
  const ip = getClientIp(h);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_sale", {
    p_items: parsed.data.items,
    p_payment_method: parsed.data.payment_method,
    p_discount: parsed.data.discount,
    p_note: parsed.data.note,
    p_ip: ip ?? undefined,
    p_user_agent: ua ?? undefined,
  });

  if (error) return { ok: false, error: error.message };

  const result = data as { ticket_number: number; total: number };
  revalidatePath("/sales");
  revalidatePath("/cash");
  return { ok: true, ticketNumber: result.ticket_number, total: result.total };
}

/** Anula una venta (solo admin). No restituye stock automáticamente. */
export async function cancelSaleAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("sales")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", {
    p_action: "sale_cancel",
    p_entity: "sale",
    p_entity_id: id,
  });
  revalidatePath("/sales");
  return { ok: true };
}
