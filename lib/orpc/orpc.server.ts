import "server-only";
import { createRouterClient } from "@orpc/server";
import { cookies, headers } from "next/headers";
import { routerORPC } from "./routers";

/**
 * Server-side client for making type-safe API calls within Server Components
 * This is the preferred way to call oRPC procedures on the server
 */
globalThis.$client = createRouterClient(routerORPC, {
  context: async () => ({
    headers: await headers(),
    cookies: await cookies(),
  }),
});

export const client = globalThis.$client;
