"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserProfileQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch user profile data
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns User profile data including personal information
 *
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUserProfileQuery()
 * ```
 */
export function useUserProfileQuery(config?: UseUserProfileQueryConfig) {
  return useQuery(
    orpc.users.me.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 5 * 60 * 1000, // 5 minutes - profile rarely changes
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    })
  );
}
