"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchCategoriesWithCount } from "./api";

export function useCategoriesManage() {
  return useQuery({
    queryKey: queryKeys.categories.manage,
    queryFn: fetchCategoriesWithCount,
  });
}
