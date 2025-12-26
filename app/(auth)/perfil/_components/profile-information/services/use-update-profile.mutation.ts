"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

/**
 * Mutation hook to update the current user's profile (name and short_name)
 * Uses oRPC TanStack Query integration for automatic mutation handling
 *
 * @example
 * ```tsx
 * const updateProfileMutation = useUpdateProfileMutation()
 * await updateProfileMutation.mutateAsync({ name: "New Name" })
 * ```
 */
export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.users.updateMe.mutationOptions(),
    onSuccess: () => {
      // Invalidate user profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() });
    },
  });
}
