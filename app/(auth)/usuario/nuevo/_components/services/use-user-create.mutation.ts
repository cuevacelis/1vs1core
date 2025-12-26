"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function useUserCreateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.users.create.mutationOptions(),
    onSuccess: () => {
      // Invalidate users list query
      queryClient.invalidateQueries({ queryKey: orpc.users.key() });
    },
  });
}
