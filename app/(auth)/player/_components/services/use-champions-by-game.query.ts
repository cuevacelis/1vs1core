"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseChampionsByGameQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch champions for a specific game
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param gameId - The ID of the game to fetch champions for
 * @param config - Optional query configuration
 * @returns List of champions for the specified game
 *
 * @example
 * ```tsx
 * const { data: champions } = useChampionsByGameQuery(1)
 * ```
 */
export function useChampionsByGameQuery(
  gameId: number,
  config?: UseChampionsByGameQueryConfig,
) {
  return useQuery(
    orpc.champions.listByGame.queryOptions({
      input: { gameId },
      enabled: config?.enabled ?? !!gameId,
      staleTime: config?.staleTime ?? 5 * 60 * 1000, // 5 minutes - champion list rarely changes
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? false, // No need to refetch on focus
    }),
  );
}
