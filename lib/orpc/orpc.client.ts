import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { AppRouter } from "./router";

declare global {
  var $client: RouterClient<AppRouter> | undefined;
}

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }

    return `${window.location.origin}/api/rpc`;
  },
});

/**
 * Client-side oRPC client for making type-safe API calls
 * Falls back to server-side client if available (for SSR optimization)
 */
export const client: RouterClient<AppRouter> =
  globalThis.$client ?? createORPCClient(link);

/**
 * TanStack Query utilities for oRPC
 * Provides queryOptions, mutationOptions, and query key management
 *
 * Usage:
 * - Queries: useQuery(orpc.users.me.queryOptions())
 * - Mutations: useMutation(orpc.auth.login.mutationOptions())
 * - Keys: queryClient.invalidateQueries({ queryKey: orpc.users.key() })
 */
export const orpc = createTanstackQueryUtils(client);
