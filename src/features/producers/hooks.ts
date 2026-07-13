"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchProducersWithCount } from "./api";

export function useProducersManage() {
  return useQuery({
    queryKey: queryKeys.producers.manage,
    queryFn: fetchProducersWithCount,
  });
}
