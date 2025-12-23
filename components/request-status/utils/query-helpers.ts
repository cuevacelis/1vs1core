import type { UseQueryResult } from "@tanstack/react-query";

/**
 * Checks if query data is empty (empty array or object with no keys)
 */
export function isQueryDataEmpty(data: unknown): boolean {
  if (!data) return true;

  if (Array.isArray(data)) {
    return data.length === 0;
  }

  if (typeof data === "object") {
    return Object.keys(data).length === 0;
  }

  return false;
}

export function hasAnyData(queries: UseQueryResult<unknown, Error>[]): boolean {
  return queries.some((query) => query.data && !isQueryDataEmpty(query.data));
}

export function extractErrorMessages(
  queries: UseQueryResult<unknown, Error>[],
): string[] {
  return queries
    .filter((query) => query.isError)
    .map((query) => query.error)
    .filter((error): error is Error => error instanceof Error)
    .map((error) => error.message);
}

export function formatErrorMessages(
  queries: UseQueryResult<unknown, Error>[],
): string | string[] {
  const messages = extractErrorMessages(queries);

  if (messages.length === 0) {
    return "¡Un error desconocido ocurrió!";
  }

  if (messages.length === 1) {
    return messages[0];
  }

  return messages;
}
