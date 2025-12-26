"use no memo";

import type { Column, HeaderContext, Table } from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData> {
  table: Table<TData>;
}

export function TableColumnSelector<TData>({
  table,
}: DataTableColumnHeaderProps<TData>) {
  const [open, setOpen] = React.useState(false);

  // Function to get the display name for a column
  const getColumnDisplayName = (column: Column<TData, unknown>): string => {
    if (typeof column.columnDef.header === "string") {
      return column.columnDef.header;
    }
    if (typeof column.columnDef.header === "function") {
      return String(
        column.columnDef.header({} as HeaderContext<TData, unknown>),
      );
    }
    return String(column.id);
  };

  // Recursive function to render column items
  const renderColumnItems = (columns: Column<TData, unknown>[], depth = 0) => {
    return columns.map((column) => {
      const isParent = column.columns && column.columns.length > 0;
      const displayName = getColumnDisplayName(column);

      return (
        <React.Fragment key={column.id}>
          {isParent && depth === 0 && <DropdownMenuSeparator />}
          <DropdownMenuCheckboxItem
            checked={column.getIsVisible()}
            onCheckedChange={(value) => {
              column.toggleVisibility(!!value);
              if (isParent) {
                for (const subColumn of column.columns) {
                  subColumn.toggleVisibility(!!value);
                }
              }
            }}
            className={cn("", {
              "ml-2": depth > 0,
              "font-bold": isParent,
            })}
          >
            {displayName}
          </DropdownMenuCheckboxItem>
          {isParent && (
            <>
              {renderColumnItems(column.columns, depth + 1)}
              {depth === 0 && <DropdownMenuSeparator />}
            </>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <Settings2 className="mr-2 h-4 w-4" />
          Columnas
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-w-[150px] max-h-[250px] overflow-y-auto"
      >
        {renderColumnItems(table.getAllColumns())}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
