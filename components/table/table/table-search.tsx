import type { Table } from "@tanstack/react-table";
import { useEffect } from "react";
import { SearchBar } from "@/components/search/search";
import { useSearchParamsTable } from "../hooks/use-search-params-table";

interface TableSearchProps<TData> {
  table: Table<TData>;
  searchParamKey?: string;
  placeholder?: string;
}

export function TableSearch<TData>({
  table,
  searchParamKey = "searchTable",
  placeholder = "Buscar en la tabla...",
}: TableSearchProps<TData>) {
  const { paramValue } = useSearchParamsTable({ searchParamKey });

  useEffect(() => {
    if (paramValue) {
      table.setGlobalFilter(paramValue);
    }
  }, [paramValue, table]);

  return (
    <SearchBar
      searchParamKey={searchParamKey}
      placeholder={placeholder}
      className="lg:min-w-sm"
      value={table.getState().globalFilter as string}
      onChange={(e) => {
        table.setGlobalFilter(e.target.value);
      }}
    />
  );
}
