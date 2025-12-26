"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserDetailQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch user details by ID
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param id - User ID
 * @param config - Optional query configuration
 * @returns User details data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useUserDetailQuery(123)
 * ```
 */
export function useUserDetailQuery(
  id: number,
  config?: UseUserDetailQueryConfig,
) {
  return useQuery(
    orpc.users.getById.queryOptions({
      input: { id },
      enabled: config?.enabled ?? !!id,
      staleTime: config?.staleTime ?? 30 * 1000,
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
