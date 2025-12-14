import { os } from "@orpc/server";
import type { AppContext } from "./context";

// Base oRPC instance with context
export const orpc = os.$context<AppContext>();

// Middleware for authentication
export const authMiddleware = orpc.middleware(
  async (options, _input, _output) => {
    if (!options.context.user) {
      throw new Error("Unauthorized");
    }
    return options.next({ context: options.context });
  },
);

// Middleware for role-based access
export const roleMiddleware = (requiredRole: string) =>
  orpc.middleware(async (options, _input, _output) => {
    if (!options.context.user) {
      throw new Error("Unauthorized");
    }

    const hasRole = options.context.user.roles.some(
      (role) => role.name === requiredRole,
    );
    if (!hasRole) {
      throw new Error("Forbidden: Insufficient permissions");
    }

    return options.next({ context: options.context });
  });

export const authedOrpc = orpc.use(authMiddleware);
export const adminOrpc = orpc.use(roleMiddleware("admin"));
