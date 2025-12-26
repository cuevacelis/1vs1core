"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

/**
 * Mutation hook to delete a tournament
 * Invalidates tournament queries on success
 *
 * @example
 * ```tsx
 * const deleteMutation = useTournamentDeleteMutation();
 *
 * deleteMutation.mutate({ id: 1 });
 * ```
 */
export function useTournamentDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.delete.mutationOptions(),
    onSuccess: () => {
      // Invalidate all tournament-related queries
      queryClient.invalidateQueries({ queryKey: orpc.tournaments.key() });
    },
  });
}
