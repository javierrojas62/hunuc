"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { categorySchema } from "./schemas";

export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe una categoría con ese slug" };
    return { ok: false, error: error.message };
  }

  await supabase.rpc("log_audit", {
    p_action: "category_create",
    p_entity: "category",
    p_entity_id: data.id,
    p_new: parsed.data,
  });

  revalidatePath("/products/categories");
  revalidatePath("/products");
  return { ok: true, data: { id: data.id } };
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya existe una categoría con ese slug" };
    return { ok: false, error: error.message };
  }

  await supabase.rpc("log_audit", {
    p_action: "category_update",
    p_entity: "category",
    p_entity_id: id,
    p_new: parsed.data,
  });

  revalidatePath("/products/categories");
  revalidatePath("/products");
  return { ok: true };
}

/** Elimina una categoría. Los productos asociados quedan sin categoría (on delete set null). */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_action: "category_delete",
    p_entity: "category",
    p_entity_id: id,
  });

  revalidatePath("/products/categories");
  revalidatePath("/products");
  return { ok: true };
}
