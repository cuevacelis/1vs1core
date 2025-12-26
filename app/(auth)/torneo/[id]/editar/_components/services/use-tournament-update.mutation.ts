"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

/**
 * Mutation hook to update an existing tournament
 * Invalidates tournament queries on success
 *
 * @example
 * ```tsx
 * const updateMutation = useTournamentUpdateMutation();
 *
 * updateMutation.mutate({
 *   id: 1,
 *   name: "Updated Tournament",
 *   description: "New description"
 * });
 * ```
 */
export function useTournamentUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.update.mutationOptions(),
    onSuccess: () => {
      // Invalidate all tournament-related queries
      queryClient.invalidateQueries({ queryKey: orpc.tournaments.key() });
    },
  });
}
