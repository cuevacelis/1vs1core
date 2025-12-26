"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

/**
 * Mutation hook to join a tournament
 * Automatically invalidates tournament participants and tournament detail queries on success
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const joinMutation = useJoinTournamentMutation();
 *
 * const handleJoin = () => {
 *   joinMutation.mutate({ tournamentId: 1 });
 * };
 * ```
 */
export function useJoinTournamentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.join.mutationOptions(),
    onSuccess: () => {
      // Invalidate tournament participants and details queries
      queryClient.invalidateQueries({
        queryKey: orpc.tournaments.getParticipants.key(),
      });
      queryClient.invalidateQueries({
        queryKey: orpc.tournaments.getById.key(),
      });
    },
  });
}
