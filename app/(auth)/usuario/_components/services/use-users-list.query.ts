"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUsersListQueryParams {
  limit?: number;
  offset?: number;
  status?: boolean;
}

interface UseUsersListQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch users list
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param params - Optional query parameters (limit, offset, status)
 * @param config - Optional query configuration
 * @returns Users list data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUsersListQuery()
 * ```
 */
export function useUsersListQuery(
  params?: UseUsersListQueryParams,
  config?: UseUsersListQueryConfig,
) {
  return useQuery(
    orpc.users.list.queryOptions({
      input: params || {},
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds default
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
