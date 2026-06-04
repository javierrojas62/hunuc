import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { clientEnv } from "@/lib/env";
import { getServerEnv } from "@/lib/env";

/**
 * Cliente con service_role: BYPASSEA RLS. Usar SOLO en server para tareas
 * administrativas controladas (seed, importación masiva, jobs). Nunca exponer.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = getServerEnv();
  return createSupabaseClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
