import { requireUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants";
import { DashboardClient } from "@/features/dashboard/components/dashboard-client";

export default async function HomePage() {
  const session = await requireUser();
  const name = session.profile.full_name?.split(" ")[0] ?? "";
  return (
    <DashboardClient
      isAdmin={session.profile.role === ROLES.ADMIN}
      name={name}
    />
  );
}
