"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import type { ParsedProduct } from "./parser";

export interface ImportResult {
  ok: boolean;
  error?: string;
  inserted?: number;
  updated?: number;
  producers?: number;
}

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

/** Inserta de forma masiva los productos parseados desde Excel/CSV. */
export async function importProductsAction(
  products: ParsedProduct[],
): Promise<ImportResult> {
  const session = await requireAdmin();
  if (!products?.length) return { ok: false, error: "No hay productos para importar" };

  const supabase = await createClient();
  const branchId = session.profile.branch_id;

  // Filas con ID existente => actualización; sin ID => alta nueva
  const toUpdate = products.filter((p) => p.id);
  const toInsert = products.filter((p) => !p.id);

  // --- Actualización masiva (precio / stock / mínimo) vía RPC con kardex ---
  let updated = 0;
  if (toUpdate.length) {
    const items = toUpdate.map((p) => ({
      id: p.id,
      name: p.name,
      unit_label: p.unitLabel,
      price: p.price,
      stock: p.stock,
      min_stock: p.minStock,
    }));
    const { data: count, error } = await supabase.rpc("bulk_update_products", {
      p_items: items,
    });
    if (error) return { ok: false, error: `Actualización: ${error.message}` };
    updated = count ?? 0;
  }

  if (!toInsert.length) {
    await supabase.rpc("log_audit", {
      p_action: "products_import",
      p_entity: "product",
      p_new: { inserted: 0, updated },
    });
    revalidatePath("/products");
    return { ok: true, inserted: 0, updated, producers: 0 };
  }

  // Categorías slug → id
  const { data: cats } = await supabase.from("categories").select("id, slug");
  const catMap = new Map((cats ?? []).map((c) => [c.slug, c.id]));

  // Productores: crear los que falten (solo para altas nuevas)
  const prefixes = [
    ...new Set(toInsert.map((p) => p.producerPrefix).filter(Boolean)),
  ] as string[];
  const { data: existing } = await supabase.from("producers").select("id, code_prefix");
  const prodMap = new Map(
    (existing ?? []).filter((p) => p.code_prefix).map((p) => [p.code_prefix as string, p.id]),
  );
  const missing = prefixes.filter((p) => !prodMap.has(p));
  let producersCreated = 0;
  if (missing.length) {
    const { data: created, error } = await supabase
      .from("producers")
      .insert(missing.map((p) => ({ name: titleCase(p), code_prefix: p })))
      .select("id, code_prefix");
    if (error) return { ok: false, error: error.message };
    (created ?? []).forEach((p) => p.code_prefix && prodMap.set(p.code_prefix, p.id));
    producersCreated = created?.length ?? 0;
  }

  const payload = toInsert.map((p) => ({
    code: p.code,
    name: p.name,
    unit_label: p.unitLabel,
    unit_value: p.unitValue,
    unit_base: p.unitBase,
    price: p.price,
    stock: p.stock ?? 0,
    min_stock: p.minStock ?? 5,
    category_id: catMap.get(p.categorySlug) ?? catMap.get("general") ?? null,
    producer_id: p.producerPrefix ? prodMap.get(p.producerPrefix) ?? null : null,
    branch_id: branchId,
    needs_review: p.needsReview,
    created_by: session.userId,
  }));

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < payload.length; i += CHUNK) {
    const { error } = await supabase.from("products").insert(payload.slice(i, i + CHUNK));
    if (error) return { ok: false, error: `Lote ${i / CHUNK + 1}: ${error.message}` };
    inserted += Math.min(CHUNK, payload.length - i);
  }

  await supabase.rpc("log_audit", {
    p_action: "products_import",
    p_entity: "product",
    p_new: { inserted, updated, producers: producersCreated },
  });

  revalidatePath("/products");
  return { ok: true, inserted, updated, producers: producersCreated };
}
