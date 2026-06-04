"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import {
  fetchProducts,
  fetchCategories,
  fetchProducers,
  quickSearchProducts,
} from "./api";
import type { ProductFilters } from "./schemas";

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducers() {
  return useQuery({
    queryKey: queryKeys.producers.all,
    queryFn: fetchProducers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuickSearch(term: string) {
  return useQuery({
    queryKey: queryKeys.products.search(term),
    queryFn: () => quickSearchProducts(term),
    enabled: term.trim().length > 0,
    placeholderData: keepPreviousData,
  });
}
