import { requireAdmin } from "@/lib/auth/session";
import { AuditClient } from "@/features/audit/components/audit-client";

export const metadata = { title: "Auditoría" };

export default async function AuditPage() {
  await requireAdmin();
  return <AuditClient />;
}
