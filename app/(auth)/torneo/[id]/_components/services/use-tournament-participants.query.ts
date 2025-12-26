"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseTournamentParticipantsQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch tournament participants by tournament ID
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param tournamentId - Tournament ID
 * @param config - Optional query configuration
 * @returns Tournament participants list
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTournamentParticipantsQuery(1)
 * ```
 */
export function useTournamentParticipantsQuery(
  tournamentId: number,
  config?: UseTournamentParticipantsQueryConfig,
) {
  return useQuery(
    orpc.tournaments.getParticipants.queryOptions({
      input: { tournamentId },
      enabled: config?.enabled ?? !!tournamentId,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds default
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
