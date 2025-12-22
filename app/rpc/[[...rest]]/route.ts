import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { BatchHandlerPlugin, CORSPlugin } from "@orpc/server/plugins";
import { cookies, headers } from "next/headers";
import { routerORPC } from "@/lib/orpc/routers";

const rpcHandler = new RPCHandler(routerORPC, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
  plugins: [
    new CORSPlugin({
      origin: (origin) => origin,
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    }),
    new BatchHandlerPlugin(),
  ],
});

async function handleRequest(request: Request) {
  const { response } = await rpcHandler.handle(request, {
    prefix: "/rpc",
    // context: {
    //   headers: headers,
    //   cookies: cookies,
    // },
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
