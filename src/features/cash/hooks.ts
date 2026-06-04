"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchCurrentCash, fetchCashHistory } from "./api";

export function useCurrentCash() {
  return useQuery({
    queryKey: queryKeys.cash.current,
    queryFn: fetchCurrentCash,
    refetchInterval: 30_000,
  });
}

export function useCashHistory() {
  return useQuery({
    queryKey: queryKeys.cash.history,
    queryFn: fetchCashHistory,
  });
}
