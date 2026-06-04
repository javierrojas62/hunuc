"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query/keys";
import { fetchUsers } from "./api";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
  });
}
