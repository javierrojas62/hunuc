import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";
import { clientEnv } from "@/lib/env";

/**
 * Cliente de Supabase para componentes Client ("use client").
 * Usa la anon key + sesión en cookies (gestionada por @supabase/ssr).
 */
export function createClient() {
  return createBrowserClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
