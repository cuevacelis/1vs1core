import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { createSession, destroySession } from "../../auth/session";
import { query } from "../../db/config";
import type { Role, User } from "../../db/types";
import { orpc } from "../server";

const authRouter = orpc.router({
  login: orpc
    .route({
      method: "POST",
      path: "/auth/login",
      summary: "User login",
      description: "Authenticate user with access code",
      tags: ["auth"],
    })
    .input(
      z.object({
        accessCode: z.string().min(1),
      })
    )
    .handler(async ({ input }) => {
      const { accessCode } = input;

      // Verify access code using PostgreSQL function
      const result = await query<{
        out_user_id: number;
        out_user_data: User;
        out_roles: Role[];
      }>("SELECT * FROM fn_auth_verify_access_code($1)", [accessCode]);

      if (result.length === 0) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid access code",
        });
      }

      const { out_user_data: user_data, out_roles: roles } = result[0];

      // Create session
      await createSession({
        userId: user_data.id,
        accessCode,
      });

      return {
        user: {
          ...user_data,
          roles,
        },
        accessCode,
      };
    }),

  logout: orpc
    .route({
      method: "POST",
      path: "/auth/logout",
      summary: "User logout",
      description: "Logout current user session",
      tags: ["auth"],
    })
    .handler(async () => {
      await destroySession();
      return { success: true };
    }),

  me: orpc
    .route({
      method: "GET",
      path: "/auth/me",
      summary: "Get current user",
      description: "Get current authenticated user information",
      tags: ["auth"],
    })
    .handler(async ({ context }) => {
      if (!context.user) {
        return null;
      }
      return context.user;
    }),
});

export default authRouter;
