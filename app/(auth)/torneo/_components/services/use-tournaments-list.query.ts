"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseTournamentsListQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

interface TournamentsListParams {
  tournament_state?: "draft" | "active" | "in_progress" | "completed" | "cancelled";
  limit?: number;
  offset?: number;
}

/**
 * Query hook to fetch list of tournaments
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param params - Optional filter parameters (status, limit, offset)
 * @param config - Optional query configuration
 * @returns List of tournaments based on filters
 *
 * @example
 * ```tsx
 * const { data: tournaments } = useTournamentsListQuery({ tournament_state: 'active' })
 * ```
 */
export function useTournamentsListQuery(
  params?: TournamentsListParams,
  config?: UseTournamentsListQueryConfig,
) {
  return useQuery(
    orpc.tournaments.list.queryOptions({
      input: params || {},
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds - moderate updates
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
