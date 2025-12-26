"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseTournamentDetailQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch tournament details by ID
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param tournamentId - Tournament ID
 * @param config - Optional query configuration
 * @returns Tournament details
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTournamentDetailQuery(1)
 * ```
 */
export function useTournamentDetailQuery(
  tournamentId: number,
  config?: UseTournamentDetailQueryConfig,
) {
  return useQuery(
    orpc.tournaments.getById.queryOptions({
      input: { id: tournamentId },
      enabled: config?.enabled ?? !!tournamentId,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds default
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
