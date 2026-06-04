"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMetrics,
  fetchDailySeries,
  fetchTopProducts,
  fetchTopSellers,
  fetchLowStock,
} from "./api";

export function useMetrics(range: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.metrics(range),
    queryFn: () => fetchMetrics(range),
  });
}

export function useDailySeries(days = 14) {
  return useQuery({
    queryKey: ["dashboard", "daily-series", days],
    queryFn: () => fetchDailySeries(days),
  });
}

export function useTopProducts(days = 30, limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.topSellers, "products", days, limit],
    queryFn: () => fetchTopProducts(days, limit),
  });
}

export function useTopSellers(days = 30) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.topSellers, days],
    queryFn: () => fetchTopSellers(days),
  });
}

export function useLowStock(limit = 50) {
  return useQuery({
    queryKey: queryKeys.products.lowStock,
    queryFn: () => fetchLowStock(limit),
  });
}

/**
 * Suscripción Realtime a ventas: cuando entra una venta nueva, invalida las
 * queries de dashboard/ventas/caja para refrescar métricas en vivo.
 */
export function useRealtimeSales() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("realtime:sales")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          queryClient.invalidateQueries({ queryKey: queryKeys.sales.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.cash.all });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
