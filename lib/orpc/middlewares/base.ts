import { os } from "@orpc/server";
import { cookies, headers } from "next/headers";

export const basedMiddleware = os.use(
  os.middleware(async ({ next }) =>
    next({
      context: {
        headers: await headers(),
        cookies: await cookies(),
      },
    })
  )
);
