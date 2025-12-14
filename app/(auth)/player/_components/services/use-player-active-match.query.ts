"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UsePlayerActiveMatchQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
}

/**
 * Query hook to fetch the player's active match
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns Active match data for the current player
 *
 * @example
 * ```tsx
 * const { data: activeMatch } = usePlayerActiveMatchQuery()
 * ```
 */
export function usePlayerActiveMatchQuery(
  config?: UsePlayerActiveMatchQueryConfig,
) {
  return useQuery(
    orpc.matches.getMyActiveMatch.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 10 * 1000, // 10 seconds - real-time data
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
      refetchInterval: config?.refetchInterval ?? 5000, // Refetch every 5 seconds for live updates
    }),
  );
}
