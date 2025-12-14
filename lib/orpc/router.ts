import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { orpc } from "./server";

/**
 * Main application router
 *
 * Aggregates all domain-specific routers into a single type-safe API.
 * Each nested router handles a specific domain (auth, tournaments, matches, etc.)
 *
 * Performance optimization:
 * - Small routers (auth, games) load immediately
 * - Large routers (tournaments, matches, champions) use lazy loading for better cold start performance
 *
 * Usage:
 * - Server: Export this router to your API handler
 * - Client: Import the AppRouter type for end-to-end type safety
 *
 * @see {@link https://orpc.dev/docs/router oRPC Router Documentation}
 */
export const appRouter = orpc.router({
  auth: orpc.lazy(() => import("./routers/auth")),
  users: orpc.lazy(() => import("./routers/users")),
  tournaments: orpc.lazy(() => import("./routers/tournaments")),
  matches: orpc.lazy(() => import("./routers/matches")),
  champions: orpc.lazy(() => import("./routers/champions")),
  games: orpc.lazy(() => import("./routers/games")),
});

/**
 * Type representing the complete application router
 * Used by the client for end-to-end type safety
 */
export type AppRouter = typeof appRouter;
export type RouterInputs = InferRouterInputs<AppRouter>;
export type RouterOutputs = InferRouterOutputs<AppRouter>;
