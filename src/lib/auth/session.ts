import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLES, type Role } from "@/lib/constants";
import type { Branch } from "@/types/db";

export interface SessionProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  branch_id: string | null;
  role: Role;
  branch: Pick<Branch, "id" | "name"> | null;
}

export interface Session {
  userId: string;
  email: string | null;
  profile: SessionProfile;
}

/**
 * Carga el usuario autenticado + su perfil y rol. Memoizado por request
 * (cache de React) para no repetir la consulta en layout + page.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, is_active, branch_id, role:roles(name), branch:branches(id, name)",
    )
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  // Supabase devuelve relaciones como objeto o array según cardinalidad.
  const roleRel = data.role as unknown as { name: string } | null;
  const branchRel = data.branch as unknown as Pick<Branch, "id" | "name"> | null;

  return {
    userId: user.id,
    email: user.email ?? null,
    profile: {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      is_active: data.is_active,
      branch_id: data.branch_id,
      role: (roleRel?.name as Role) ?? ROLES.SELLER,
      branch: branchRel,
    },
  };
});

/** Exige sesión activa; si no, redirige a login. */
export async function requireUser(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!session.profile.is_active) redirect("/login?error=inactive");
  return session;
}

/** Exige rol admin; si no, redirige al inicio. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireUser();
  if (session.profile.role !== ROLES.ADMIN) redirect("/");
  return session;
}
