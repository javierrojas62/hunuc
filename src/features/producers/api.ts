import { createClient } from "@/lib/supabase/client";
import type { Producer } from "@/types/db";

export interface ProducerRow extends Producer {
  product_count: number;
}

export async function fetchProducersWithCount(): Promise<ProducerRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("producers")
    .select("*, products(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const { products, ...producer } = row as Producer & {
      products: { count: number }[];
    };
    return { ...producer, product_count: products?.[0]?.count ?? 0 };
  });
}
