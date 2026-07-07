import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types/db";

export interface CategoryRow extends Category {
  product_count: number;
}

export async function fetchCategoriesWithCount(): Promise<CategoryRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const { products, ...category } = row as Category & {
      products: { count: number }[];
    };
    return { ...category, product_count: products?.[0]?.count ?? 0 };
  });
}
