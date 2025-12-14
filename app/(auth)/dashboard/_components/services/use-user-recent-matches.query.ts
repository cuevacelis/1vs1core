"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserRecentMatchesQueryParams {
  limit?: number;
  offset?: number;
}

interface UseUserRecentMatchesQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch user's recent matches
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param params - Query parameters (limit, offset)
 * @param config - Optional query configuration
 * @returns Recent match history with opponent and result information
 *
 * @example
 * ```tsx
 * const { data: matches } = useUserRecentMatchesQuery({ limit: 5 })
 * ```
 */
export function useUserRecentMatchesQuery(
  params: UseUserRecentMatchesQueryParams = {},
  config?: UseUserRecentMatchesQueryConfig,
) {
  const { limit = 10, offset = 0 } = params;

  return useQuery(
    orpc.users.myRecentMatches.queryOptions({
      input: { limit, offset },
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
