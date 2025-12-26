"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserMeQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch current user profile
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns Current user profile data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUserMeQuery()
 * ```
 */
export function useUserMeQuery(config?: UseUserMeQueryConfig) {
  return useQuery(
    orpc.users.me.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 5 * 60 * 1000, // 5 minutes default
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
