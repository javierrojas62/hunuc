import { requireAdmin } from "@/lib/auth/session";
import { ProducersClient } from "@/features/producers/components/producers-client";

export const metadata = { title: "Productores" };

export default async function ProducersPage() {
  await requireAdmin();
  return <ProducersClient />;
}
