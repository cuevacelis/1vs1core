"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseGamesListQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch list of available games
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns List of games available for tournaments
 *
 * @example
 * ```tsx
 * const { data: games } = useGamesListQuery()
 * ```
 */
export function useGamesListQuery(config?: UseGamesListQueryConfig) {
  return useQuery(
    orpc.games.list.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 10 * 60 * 1000, // 10 minutes - games list rarely changes
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? false, // No need to refetch on focus
    }),
  );
}
