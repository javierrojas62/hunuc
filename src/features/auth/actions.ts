"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseUserAgent, getClientIp } from "@/lib/user-agent";
import { loginSchema } from "./schemas";

export interface AuthActionState {
  error?: string;
}

/**
 * Inicia sesión con email + contraseña. Registra la sesión y un audit log
 * de "login". Redirige al inicio si tiene éxito.
 */
export async function signInAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user) {
    return { error: "Email o contraseña incorrectos" };
  }

  // Verificar que el perfil esté activo
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", data.user.id)
    .single();
  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta está desactivada. Contactá al administrador." };
  }

  // Registrar sesión + auditoría (best-effort, no bloquea el login)
  try {
    const h = await headers();
    const ua = h.get("user-agent");
    const { browser, device } = parseUserAgent(ua);
    const ip = getClientIp(h);

    await supabase.from("sessions").insert({
      user_id: data.user.id,
      ip,
      user_agent: ua,
      device,
      browser,
    });
    await supabase.rpc("log_audit", {
      p_action: "login",
      p_entity: "session",
      p_ip: ip ?? undefined,
      p_user_agent: ua ?? undefined,
      p_device: device,
      p_browser: browser,
    });
  } catch {
    // ignorar errores de telemetría
  }

  redirect("/");
}

/** Cierra la sesión y vuelve al login. */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.rpc("log_audit", { p_action: "logout", p_entity: "session" });
  await supabase.auth.signOut();
  redirect("/login");
}
