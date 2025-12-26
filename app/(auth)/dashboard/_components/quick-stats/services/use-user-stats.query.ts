"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserStatsQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch current user statistics
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns User match statistics including wins, losses, win rate, and streak
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useUserStatsQuery()
 * ```
 */
export function useUserStatsQuery(config?: UseUserStatsQueryConfig) {
  return useQuery(
    orpc.users.myStats.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
