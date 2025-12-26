"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function useAdminRemoveParticipantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.adminRemoveParticipant.mutationOptions(),
    onSuccess: () => {
      // Invalidate participants list to refresh
      queryClient.invalidateQueries({
        queryKey: orpc.tournaments.getParticipants.key(),
      });
    },
  });
}
