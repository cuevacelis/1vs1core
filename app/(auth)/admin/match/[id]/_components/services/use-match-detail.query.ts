"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseMatchDetailQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
}

/**
 * Query hook to fetch match detail data for admin viewer
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param matchId - The ID of the match to fetch
 * @param config - Optional query configuration
 * @returns Match detail data including players and selections
 *
 * @example
 * ```tsx
 * const { data: match } = useMatchDetailQuery(123)
 * ```
 */
export function useMatchDetailQuery(
  matchId: number,
  config?: UseMatchDetailQueryConfig,
) {
  return useQuery(
    orpc.matches.getById.queryOptions({
      input: { id: matchId },
      enabled: config?.enabled ?? !!matchId,
      staleTime: config?.staleTime ?? 10 * 1000, // 10 seconds - real-time data
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
      refetchInterval: config?.refetchInterval ?? 5000, // Refetch every 5 seconds for live updates
    }),
  );
}
