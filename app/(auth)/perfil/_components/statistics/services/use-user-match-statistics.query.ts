"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserMatchStatisticsQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch user match statistics
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns User match statistics including wins, losses, and win rate
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useUserMatchStatisticsQuery()
 * ```
 */
export function useUserMatchStatisticsQuery(
  config?: UseUserMatchStatisticsQueryConfig
) {
  return useQuery(
    orpc.users.myStats.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds - moderate updates
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    })
  );
}
