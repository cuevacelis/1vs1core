/**
 * Clean empty params from search params object
 * Removes undefined and empty string values
 */
export function cleanEmptyParams(
  params: Record<string, string | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as Record<string, string>;
}
