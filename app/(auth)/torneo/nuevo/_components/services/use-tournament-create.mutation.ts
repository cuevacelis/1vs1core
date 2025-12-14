"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

/**
 * Mutation hook to create a new tournament
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @returns Mutation object for creating tournaments
 *
 * @example
 * ```tsx
 * const createMutation = useTournamentCreateMutation();
 *
 * const handleCreate = async (data) => {
 *   await createMutation.mutateAsync(data);
 *   router.push("/torneo");
 * };
 * ```
 */
export function useTournamentCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.create.mutationOptions(),
    onSuccess: () => {
      // Invalidate tournaments list to refetch after creation
      queryClient.invalidateQueries({ queryKey: orpc.tournaments.key() });
    },
  });
}
