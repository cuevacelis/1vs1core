"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseNavigationItemsQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch navigation items for current user based on their roles
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns Navigation items array with title, href, icon, and display order
 *
 * @example
 * ```tsx
 * const { data: navItems, isLoading } = useNavigationItemsQuery()
 * ```
 */
export function useNavigationItemsQuery(
  config?: UseNavigationItemsQueryConfig,
) {
  return useQuery(
    orpc.users.myNavigation.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 5 * 60 * 1000, // 5 minutes - navigation rarely changes
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
