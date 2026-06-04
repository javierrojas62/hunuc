import { requireUser } from "@/lib/auth/session";
import { PosClient } from "@/features/sales/components/pos-client";

export const metadata = { title: "Vender" };

export default async function PosPage() {
  await requireUser();
  return <PosClient />;
}
