import { createClient } from "@/lib/supabase/client";

export interface UserRow {
  id: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  role: string;
  branch_name: string | null;
}

export async function fetchUsers(): Promise<UserRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_active, created_at, role:roles(name), branch:branches(name)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => {
    const role = p.role as unknown as { name: string } | null;
    const branch = p.branch as unknown as { name: string } | null;
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      is_active: p.is_active,
      created_at: p.created_at,
      role: role?.name ?? "seller",
      branch_name: branch?.name ?? null,
    };
  });
}
