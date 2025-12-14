import "server-only";

import { createRouterClient } from "@orpc/server";
import { createContext } from "./context";
import { appRouter } from "./router";

/**
 * Server-side client for making type-safe API calls within Server Components
 * This is the preferred way to call oRPC procedures on the server
 */
globalThis.$client = createRouterClient(appRouter, {
  context: createContext,
});

export const client = globalThis.$client;
