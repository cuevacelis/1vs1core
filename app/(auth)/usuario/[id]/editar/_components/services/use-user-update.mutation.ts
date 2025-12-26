"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function useUserUpdateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.users.update.mutationOptions(),
    onSuccess: (data) => {
      // Invalidate users list query
      queryClient.invalidateQueries({ queryKey: orpc.users.list.key() });
      // Invalidate specific user detail query
      queryClient.invalidateQueries({
        queryKey: orpc.users.getById.queryKey({ input: { id: data.id } }),
      });
    },
  });
}
