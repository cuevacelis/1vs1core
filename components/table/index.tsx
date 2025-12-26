"use no memo";
import type { RankingInfo } from "@tanstack/match-sorter-utils";
import type { FilterFn, RowData, TableOptions } from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";
import type React from "react";
import { cn } from "@/lib/utils";
import { initialDataTable } from "@/lib/utils/table-utils";
import { Table } from "../ui/table";
import { TableBody } from "./table/table-body";
import { TableColumnSelector } from "./table/table-column-selector";
import { TableFooter } from "./table/table-footer";
import { TableHeader } from "./table/table-header";
import { TableSearch } from "./table/table-search";

declare module "@tanstack/react-table" {
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: RankingInfo;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    focusCellInput: ({
      rowId,
      columnId,
    }: {
      rowId: string;
      columnId: string;
    }) => void;
    noteInputRefs?: React.RefObject<Map<string, HTMLInputElement | null>>;
  }
}

interface TableCompleteComponentProps<TData> {
  title?: string;
  description?: string;
  tableOptions: TableOptions<TData>;
  expandedRows?: Record<number, boolean>;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  search?: {
    show: boolean;
    searchParamKey?: string;
    placeholder?: string;
  };
  footer?: {
    showSelectedRows: boolean;
    showPagination: boolean;
  };
  className?: string;
  classNameContainerTable?: string;
  classNameTable?: string;
}

export function TableCompleteComponent<TData>({
  title,
  description,
  tableOptions,
  search,
  expandedRows,
  renderExpandedRow,
  footer,
  className,
  classNameContainerTable,
  classNameTable,
}: TableCompleteComponentProps<TData>) {
  const tableTanstack = useReactTable({
    ...tableOptions,
    data: tableOptions.data ?? initialDataTable,
    initialState: {
      pagination: {
        pageSize: 40,
      },
    },
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    globalFilterFn: "fuzzy",
  });

  return (
    <section
      className={cn(
        "px-1 block max-w-full overflow-x-hidden overflow-y-hidden",
        className,
      )}
    >
      <div>
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2 py-6">
        {search?.show && (
          <div className="w-full sm:w-auto">
            <TableSearch
              table={tableTanstack}
              searchParamKey={search.searchParamKey}
              placeholder={search.placeholder}
            />
          </div>
        )}
        {tableTanstack.options.enableHiding && (
          <div className="w-full sm:w-auto flex justify-end">
            <TableColumnSelector table={tableTanstack} />
          </div>
        )}
      </div>
      <div
        className={cn(
          "rounded-lg border-2 overflow-y-auto overflow-x-auto",
          classNameContainerTable,
        )}
      >
        <Table
          className={cn("w-full", classNameTable)}
          style={{
            width: "100%",
            minWidth: tableTanstack.getTotalSize(),
          }}
        >
          <TableHeader table={tableTanstack} />
          <TableBody
            table={tableTanstack}
            columns={tableOptions.columns}
            expandedRows={expandedRows}
            renderExpandedRow={renderExpandedRow}
          />
        </Table>
      </div>
      {footer && (
        <TableFooter
          table={tableTanstack}
          showSelectedRows={footer.showSelectedRows}
          showPagination={footer.showPagination}
          className="mt-4"
        />
      )}
    </section>
  );
}
