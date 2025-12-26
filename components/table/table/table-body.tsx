"use no memo";

import { type ColumnDef, flexRender, type Table } from "@tanstack/react-table";
import { Fragment } from "react";
import { TableBody as TableBodyUI } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableBodyProps<TData> {
  table: Table<TData>;
  columns: ColumnDef<TData>[];
  expandedRows?: Record<number, boolean>;
  renderExpandedRow?: (row: TData) => React.ReactNode;
  className?: string;
}

export function TableBody<TData>({
  table,
  columns,
  expandedRows,
  renderExpandedRow,
  className,
}: TableBodyProps<TData>) {
  return (
    <TableBodyUI className={cn(className)}>
      {table.getRowModel().rows.map((row) => (
        <Fragment key={row.id}>
          <tr
            className={cn("border-b transition-colors hover:bg-muted/50", {
              "bg-muted": row.getIsSelected(),
            })}
          >
            {row.getVisibleCells().map((cell) => (
              <td
                key={cell.id}
                style={{ width: cell.column.getSize() }}
                className="px-3 py-1 text-sm border-r"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
          {expandedRows?.[row.index] && renderExpandedRow && (
            <tr>
              <td colSpan={columns.length}>
                {renderExpandedRow(row.original)}
              </td>
            </tr>
          )}
        </Fragment>
      ))}
    </TableBodyUI>
  );
}
