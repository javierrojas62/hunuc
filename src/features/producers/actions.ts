"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { producerSchema } from "./schemas";

export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export async function createProducerAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = producerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producers")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_action: "producer_create",
    p_entity: "producer",
    p_entity_id: data.id,
    p_new: parsed.data,
  });

  revalidatePath("/products/producers");
  revalidatePath("/products");
  return { ok: true, data: { id: data.id } };
}

export async function updateProducerAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = producerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("producers")
    .update(parsed.data)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_action: "producer_update",
    p_entity: "producer",
    p_entity_id: id,
    p_new: parsed.data,
  });

  revalidatePath("/products/producers");
  revalidatePath("/products");
  return { ok: true };
}

/** Elimina un productor. Los productos asociados quedan sin productor (on delete set null). */
export async function deleteProducerAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("producers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await supabase.rpc("log_audit", {
    p_action: "producer_delete",
    p_entity: "producer",
    p_entity_id: id,
  });

  revalidatePath("/products/producers");
  revalidatePath("/products");
  return { ok: true };
}
