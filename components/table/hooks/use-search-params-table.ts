import { useNavigate, useSearch } from "@tanstack/react-router";
import { cleanEmptyParams } from "@/lib/utils/search-utils";

interface UseSearchParamsTableProps {
  searchParamKey?: string;
}

export function useSearchParamsTable(props: UseSearchParamsTableProps) {
  const navigate = useNavigate();
  const filters = useSearch({ strict: false });
  const paramValue = props.searchParamKey
    ? (filters as Record<string, string | undefined>)[props.searchParamKey]
    : undefined;

  const setFilters = (partialFilters: Partial<typeof filters>) =>
    navigate({
      to: ".",
      search: (prev) => cleanEmptyParams({ ...prev, ...partialFilters }),
    });

  const resetFilters = () => navigate({ to: ".", search: {} });

  return {
    filters,
    paramValue,
    setFilters,
    resetFilters,
  };
}
