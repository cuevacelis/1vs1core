import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from "@tanstack/react-query";
import { cache } from "react";
import { createQueryClient } from "./client";

/**
 * Cached QueryClient instance for Server Components
 * Uses React's cache() to ensure single instance per request
 */
export const getQueryClient = cache(createQueryClient);

/**
 * Hydration boundary for Server Components
 * Wraps components that need hydrated query data from server
 *
 * Usage in Server Components:
 * ```tsx
 * export default function Page() {
 *   const queryClient = getQueryClient()
 *   queryClient.prefetchQuery(orpc.users.me.queryOptions())
 *
 *   return (
 *     <HydrateClient client={queryClient}>
 *       <ClientComponent />
 *     </HydrateClient>
 *   )
 * }
 * ```
 */
export function HydrateClient(props: {
  children: React.ReactNode;
  client: QueryClient;
}) {
  return (
    <HydrationBoundary state={dehydrate(props.client)}>
      {props.children}
    </HydrationBoundary>
  );
}
