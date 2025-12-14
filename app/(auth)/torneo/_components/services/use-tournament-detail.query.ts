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
 * Query hook to fetch tournament detail data
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param tournamentId - The ID of the tournament to fetch
 * @param config - Optional query configuration
 * @returns Tournament detail data including participants and matches
 *
 * @example
 * ```tsx
 * const { data: tournament } = useTournamentDetailQuery(123)
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
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds - moderate updates
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
