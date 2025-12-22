import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { RouterORPC } from "./routers";

declare global {
  var $client: RouterClient<RouterORPC> | undefined;
}

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error("RPCLink is not allowed on the server side.");
    }

    return `${window.location.origin}/rpc`;
  },
});

export const client: RouterClient<RouterORPC> =
  globalThis.$client ?? createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
