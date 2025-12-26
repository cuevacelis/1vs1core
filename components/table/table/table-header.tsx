/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
"use no memo";

import { flexRender, type Header, type Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableHeader as TableHeaderUI } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableHeaderProps<TData> {
  table: Table<TData>;
}

export function TableHeader<TData>({ table }: TableHeaderProps<TData>) {
  return (
    <TableHeaderUI className="sticky top-0 z-5">
      {table.getHeaderGroups().map((headerGroup) => (
        <tr
          key={headerGroup.id}
          className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-950"
        >
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              colSpan={header.colSpan}
              style={{ width: header.getSize() }}
              className={cn(
                "relative px-1 py-1 text-center text-sm font-medium text-foreground border-r",
                {
                  "text-center": header.colSpan > 1,
                  "select-none":
                    header.column.getCanSort() || header.column.getIsResizing(),
                },
              )}
            >
              {header.isPlaceholder ? null : (
                <DataTableColumnHeader header={header} />
              )}
              {header.column.getCanResize() && (
                <div
                  onMouseDown={header.getResizeHandler()}
                  onTouchStart={header.getResizeHandler()}
                  className={cn(
                    "absolute z-10 top-0 right-0 h-full w-0.5 cursor-col-resize select-none touch-none transition",
                    {
                      "bg-accent-foreground": header.column.getIsResizing(),
                    },
                  )}
                />
              )}
            </th>
          ))}
        </tr>
      ))}
    </TableHeaderUI>
  );
}

interface DataTableColumnHeaderProps<TData>
  extends React.HTMLAttributes<HTMLDivElement> {
  header: Header<TData, unknown>;
}

function DataTableColumnHeader<TData>({
  header,
  className,
}: DataTableColumnHeaderProps<TData>) {
  const columnTitle = flexRender(
    header.column.columnDef.header,
    header.getContext(),
  );
  const column = header.column;
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{columnTitle}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 data-[state=open]:bg-accent"
          >
            <span>{columnTitle}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-4" />
            ) : (
              <ChevronsUpDown className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUp className="size-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowDown className="size-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.clearSorting()}>
            <ChevronsUpDown className="size-3.5 text-muted-foreground/70" />
            Restablecer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <EyeOff className="size-3.5 text-muted-foreground/70" />
            Ocultar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
