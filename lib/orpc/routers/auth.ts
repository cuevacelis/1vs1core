import { ORPCError } from "@orpc/server";
import * as bcrypt from "bcryptjs";
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
      }),
    )
    .handler(async ({ input }) => {
      const { accessCode } = input;

      // Find user by access code hash
      const users = await query<User>("SELECT * FROM users WHERE status = $1", [
        true,
      ]);

      let matchedUser: User | null = null;

      for (const user of users) {
        const isMatch = await bcrypt.compare(accessCode, user.access_code_hash);
        if (isMatch) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Invalid access code",
        });
      }

      // Get user roles
      const roles = await query<Role>(
        `SELECT r.* FROM role r
         INNER JOIN role_user ru ON r.id = ru.role_id
         WHERE ru.user_id = $1 AND ru.status = true`,
        [matchedUser.id],
      );

      // Create session
      await createSession({
        userId: matchedUser.id,
        accessCode,
      });

      return {
        user: {
          ...matchedUser,
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
