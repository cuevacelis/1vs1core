"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function useAdminAddParticipantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.adminAddParticipant.mutationOptions(),
    onSuccess: () => {
      // Invalidate participants list to refresh
      queryClient.invalidateQueries({
        queryKey: orpc.tournaments.getParticipants.queryKey(),
      });
    },
  });
}
