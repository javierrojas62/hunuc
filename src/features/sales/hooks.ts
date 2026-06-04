"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchSales, fetchSaleDetail, fetchTodaySales, type SaleListFilters } from "./api";

export function useSales(filters: SaleListFilters) {
  return useQuery({
    queryKey: queryKeys.sales.list(filters),
    queryFn: () => fetchSales(filters),
    placeholderData: keepPreviousData,
  });
}

export function useSaleDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.sales.detail(id ?? ""),
    queryFn: () => fetchSaleDetail(id!),
    enabled: Boolean(id),
  });
}

export function useTodaySales() {
  return useQuery({
    queryKey: queryKeys.sales.today,
    queryFn: fetchTodaySales,
    refetchInterval: 30_000,
  });
}
