import { requireUser } from "@/lib/auth/session";
import { ROLES } from "@/lib/constants";
import { ProductsClient } from "@/features/products/components/products-client";

export const metadata = { title: "Productos" };

export default async function ProductsPage() {
  const session = await requireUser();
  const isAdmin = session.profile.role === ROLES.ADMIN;
  return <ProductsClient isAdmin={isAdmin} />;
}
