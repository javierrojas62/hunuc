import { requireUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants";
import { SalesClient } from "@/features/sales/components/sales-client";

export const metadata = { title: "Ventas" };

export default async function SalesPage() {
  const session = await requireUser();
  return <SalesClient isAdmin={session.profile.role === ROLES.ADMIN} />;
}
