import { requireUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants";
import { CashClient } from "@/features/cash/components/cash-client";

export const metadata = { title: "Caja" };

export default async function CashPage() {
  const session = await requireUser();
  return <CashClient isAdmin={session.profile.role === ROLES.ADMIN} />;
}
