"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseAvailableUsersQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch all available users (for adding participants)
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns Lista de usuarios disponibles
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useAvailableUsersQuery()
 * ```
 */
export function useAvailableUsersQuery(config?: UseAvailableUsersQueryConfig) {
  return useQuery(
    orpc.users.list.queryOptions({
      input: {
        limit: 100,
        offset: 0,
      },
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds default
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? false,
    }),
  );
}
