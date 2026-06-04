import { requireAdmin } from "@/lib/auth/session";
import { UsersClient } from "@/features/users/components/users-client";

export const metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const session = await requireAdmin();
  return <UsersClient currentUserId={session.userId} />;
}
