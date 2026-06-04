import { requireAdmin } from "@/lib/auth/session";
import { ImportClient } from "@/features/import/components/import-client";

export const metadata = { title: "Importar productos" };

export default async function ImportPage() {
  await requireAdmin();
  return <ImportClient />;
}
