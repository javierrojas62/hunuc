"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { createUserSchema } from "./schemas";

export interface UserActionResult {
  ok: boolean;
  error?: string;
}

/** Crea un usuario (vendedor/admin). Usa la admin API + service role. */
export async function createUserAction(input: unknown): Promise<UserActionResult> {
  const session = await requireAdmin();
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: {
      full_name: parsed.data.full_name,
      role: parsed.data.role,
      branch_id: session.profile.branch_id,
    },
  });
  if (error) return { ok: false, error: error.message };

  // El trigger handle_new_user crea el profile; reforzamos nombre/rol por las dudas.
  const supabase = await createClient();
  const { data: role } = await supabase
    .from("roles")
    .select("id")
    .eq("name", parsed.data.role)
    .single();
  if (data.user && role) {
    await supabase
      .from("profiles")
      .update({ full_name: parsed.data.full_name, role_id: role.id, branch_id: session.profile.branch_id })
      .eq("id", data.user.id);
  }

  await supabase.rpc("log_audit", {
    p_action: "user_create",
    p_entity: "profile",
    p_entity_id: data.user?.id,
    p_new: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserRoleAction(
  userId: string,
  role: "admin" | "seller",
): Promise<UserActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: roleRow } = await supabase.from("roles").select("id").eq("name", role).single();
  if (!roleRow) return { ok: false, error: "Rol inexistente" };
  const { error } = await supabase.from("profiles").update({ role_id: roleRow.id }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("log_audit", { p_action: "user_role_change", p_entity: "profile", p_entity_id: userId, p_new: { role } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function toggleUserActiveAction(
  userId: string,
  isActive: boolean,
): Promise<UserActionResult> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
