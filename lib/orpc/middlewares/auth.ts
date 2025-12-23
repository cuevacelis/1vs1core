import { ORPCError, os } from "@orpc/server";
import { getSession } from "@/lib/auth/session";
import { basedMiddleware } from "./base";

export const authedMiddleware = basedMiddleware.use(
  os.middleware(async ({ next }) => {
    const session = await getSession();

    if (!session) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({
      context: {
        session: session,
      },
    });
  }),
);
