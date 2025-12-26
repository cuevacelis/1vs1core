"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { cleanEmptyParams } from "@/lib/utils/search-utils";

interface UseSearchParamsTableProps {
  searchParamKey?: string;
}

export function useSearchParamsTable(props: UseSearchParamsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Convert URLSearchParams to plain object
  const filters = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  // Get specific param value if searchParamKey is provided
  const paramValue = props.searchParamKey
    ? searchParams.get(props.searchParamKey) ?? undefined
    : undefined;

  // Set filters by merging with existing params
  const setFilters = useCallback(
    (partialFilters: Record<string, string | undefined>) => {
      // Merge new filters
      const merged = { ...filters, ...partialFilters };
      const cleaned = cleanEmptyParams(merged);

      // Build new URLSearchParams
      const newParams = new URLSearchParams();
      Object.entries(cleaned).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          newParams.set(key, String(value));
        }
      });

      // Navigate with new params
      router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    },
    [router, pathname, filters]
  );

  // Reset all filters
  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return {
    filters,
    paramValue,
    setFilters,
    resetFilters,
  };
}
