import { compareItems } from "@tanstack/match-sorter-utils";
import type { SortingFn } from "@tanstack/react-table";
import { sortingFns } from "@tanstack/react-table";

export const fuzzySort: SortingFn<unknown> = (rowA, rowB, columnId) => {
  let dir = 0;

  if (rowA.columnFiltersMeta[columnId]) {
    dir = compareItems(
      rowA.columnFiltersMeta[columnId]?.itemRank ?? 0,
      rowB.columnFiltersMeta[columnId]?.itemRank ?? 0,
    );
  }

  return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const currencySort: SortingFn<any> = (rowA, rowB, columnId) => {
  const extractNumber = (value: string) => {
    const match = value.replace(/[^\d.-]/g, "");
    return Number.parseFloat(match) || 0;
  };

  const a = rowA.getValue(columnId);
  const b = rowB.getValue(columnId);

  const aValue = typeof a === "string" ? extractNumber(a) : (a as number);
  const bValue = typeof b === "string" ? extractNumber(b) : (b as number);

  return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
};
