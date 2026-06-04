"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { productSchema, stockAdjustSchema } from "./schemas";

export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function createProductAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const session = await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      ...parsed.data,
      branch_id: session.profile.branch_id,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_action: "product_create",
    p_entity: "product",
    p_entity_id: data.id,
    p_new: parsed.data,
  });

  revalidatePath("/products");
  return { ok: true, data: { id: data.id } };
}

export async function updateProductAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  // El cambio de precio queda auditado por el trigger trg_audit_price.
  const { error } = await supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/products");
  return { ok: true };
}

/** Activa/desactiva un producto (borrado lógico). */
export async function toggleProductActiveAction(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/products");
  return { ok: true };
}

/** Eliminación física (usar con cuidado; preferir desactivar). */
export async function deleteProductAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", {
    p_action: "product_delete",
    p_entity: "product",
    p_entity_id: id,
  });
  revalidatePath("/products");
  return { ok: true };
}

/** Ajuste de stock vía RPC (registra kardex + auditoría). */
export async function adjustStockAction(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = stockAdjustSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("adjust_stock", {
    p_product_id: parsed.data.product_id,
    p_new_stock: parsed.data.new_stock,
    p_reason: parsed.data.reason,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/products");
  return { ok: true };
}
