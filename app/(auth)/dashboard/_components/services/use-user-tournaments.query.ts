"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseUserTournamentsQueryParams {
  limit?: number;
  offset?: number;
}

interface UseUserTournamentsQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch user's joined tournaments
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param params - Query parameters (limit, offset)
 * @param config - Optional query configuration
 * @returns List of tournaments the user is participating in
 *
 * @example
 * ```tsx
 * const { data: tournaments } = useUserTournamentsQuery({ limit: 5 })
 * ```
 */
export function useUserTournamentsQuery(
  params: UseUserTournamentsQueryParams = {},
  config?: UseUserTournamentsQueryConfig,
) {
  const { limit = 10, offset = 0 } = params;

  return useQuery(
    orpc.users.myTournaments.queryOptions({
      input: { limit, offset },
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
