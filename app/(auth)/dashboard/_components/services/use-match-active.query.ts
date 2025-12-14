"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseMatchActiveQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch user's active match
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns Current active match if one exists, null otherwise
 *
 * @example
 * ```tsx
 * const { data: activeMatch } = useMatchActiveQuery()
 * ```
 */
export function useMatchActiveQuery(config?: UseMatchActiveQueryConfig) {
  return useQuery(
    orpc.matches.getMyActiveMatch.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 10 * 1000, // 10 seconds (active matches need frequent updates)
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
