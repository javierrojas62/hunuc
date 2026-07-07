import { requireAdmin } from "@/lib/auth/session";
import { CategoriesClient } from "@/features/categories/components/categories-client";

export const metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  await requireAdmin();
  return <CategoriesClient />;
}
