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
