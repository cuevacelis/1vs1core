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
 * Query hook to fetch tournament participants
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param tournamentId - The ID of the tournament to fetch participants for
 * @param config - Optional query configuration
 * @returns List of tournament participants
 *
 * @example
 * ```tsx
 * const { data: participants } = useTournamentParticipantsQuery(123)
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
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds - moderate updates
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
