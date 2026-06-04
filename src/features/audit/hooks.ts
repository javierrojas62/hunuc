"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchAuditLogs, type AuditFilters } from "./api";

export function useAuditLogs(filters: AuditFilters) {
  return useQuery({
    queryKey: queryKeys.audit.list(filters),
    queryFn: () => fetchAuditLogs(filters),
    placeholderData: keepPreviousData,
  });
}
