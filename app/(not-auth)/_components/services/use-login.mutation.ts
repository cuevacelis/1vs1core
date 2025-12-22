"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

/**
 * Mutation hook to authenticate user with access code
 * Uses oRPC TanStack Query integration for automatic mutation management
 *
 * @returns Login mutation with automatic query invalidation
 *
 * @example
 * ```tsx
 * const loginMutation = useLoginMutation()
 *
 * const handleLogin = async () => {
 *   await loginMutation.mutateAsync({ accessCode: "code123" })
 * }
 * ```
 */
export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.auth.login.mutationOptions({
      context: { cache: true },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.auth.login.key(),
        });
      },
    })
  );
}
