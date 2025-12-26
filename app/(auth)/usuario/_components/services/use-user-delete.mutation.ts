"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function useUserDeleteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.users.delete.mutationOptions(),
    onSuccess: () => {
      // Invalidate users list query
      queryClient.invalidateQueries({ queryKey: orpc.users.list.key() });
    },
  });
}
