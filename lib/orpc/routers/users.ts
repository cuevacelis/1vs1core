import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import type { User } from "../../db/types";
import { adminOrpc, authedOrpc, orpc } from "../server";

export const usersRouter = orpc.router({
  // Admin: Create new user with auto-generated access code
  create: adminOrpc
    .route({
      method: "POST",
      path: "/users",
      summary: "Create user",
      description:
        "Create a new user with auto-generated access code (admin only)",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        short_name: z.string().max(50).optional(),
        persona_id: z.number().optional(),
        url_image: z.string().optional(),
        roles: z.array(z.enum(["admin", "player"])).default(["player"]),
      }),
    )
    .handler(async ({ input }) => {
      // Create user with auto-generated access code
      const result = await query<{
        user_id: number;
        access_code: string;
        user_name: string;
      }>(`SELECT * FROM create_user_with_access_code($1, $2, $3, $4)`, [
        input.name,
        input.short_name,
        input.persona_id,
        input.url_image,
      ]);

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create user",
        });
      }

      const newUser = result[0];

      // Assign roles
      for (const roleName of input.roles) {
        await query(`SELECT assign_role_to_user($1, $2)`, [
          newUser.user_id,
          roleName,
        ]);
      }

      return {
        id: newUser.user_id,
        name: newUser.user_name,
        access_code: newUser.access_code,
        message:
          "IMPORTANT: Save this access code securely. It cannot be retrieved later.",
      };
    }),

  // Admin: List all users
  list: adminOrpc
    .route({
      method: "GET",
      path: "/users",
      summary: "List users",
      description: "Get all users (admin only)",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.boolean().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { limit, offset, status } = input;

      let queryText = `
        SELECT u.id, u.name, u.short_name, u.status, u.suspension_status,
               u.url_image, u.creation_date, u.modification_date,
               COALESCE(
                 json_agg(
                   json_build_object('id', r.id, 'name', r.name, 'description', r.description)
                 ) FILTER (WHERE r.id IS NOT NULL),
                 '[]'
               ) as roles
        FROM users u
        LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.status = true
        LEFT JOIN role r ON ru.role_id = r.id
      `;

      const params: any[] = [];

      if (status !== undefined) {
        queryText += ` WHERE u.status = $1`;
        params.push(status);
      }

      queryText += ` GROUP BY u.id ORDER BY u.creation_date DESC LIMIT $${
        params.length + 1
      } OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const users = await query(queryText, params);

      return users;
    }),

  // Admin: Get user by ID
  getById: adminOrpc
    .route({
      method: "GET",
      path: "/users/{id}",
      summary: "Get user details",
      description:
        "Get detailed information about a specific user (admin only)",
      tags: ["users", "admin"],
    })
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const users = await query(
        `SELECT u.id, u.name, u.short_name, u.status, u.suspension_status,
                u.url_image, u.creation_date, u.modification_date,
                COALESCE(
                  json_agg(
                    json_build_object('id', r.id, 'name', r.name, 'description', r.description)
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'
                ) as roles
         FROM users u
         LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.status = true
         LEFT JOIN role r ON ru.role_id = r.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [input.id],
      );

      if (users.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "User not found",
        });
      }

      return users[0];
    }),

  // Admin: Update user
  update: adminOrpc
    .route({
      method: "PATCH",
      path: "/users/{id}",
      summary: "Update user",
      description: "Update user details (admin only)",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        short_name: z.string().max(50).optional(),
        status: z.boolean().optional(),
        suspension_status: z.enum(["suspended"]).nullable().optional(),
        url_image: z.string().optional(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...updates } = input;
      const setClause: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          setClause.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (setClause.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No fields to update",
        });
      }

      values.push(id);
      const result = await query<User>(
        `UPDATE users SET ${setClause.join(
          ", ",
        )} WHERE id = $${paramIndex} RETURNING *`,
        values,
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "User not found",
        });
      }

      return result[0];
    }),

  // Admin: Assign role to user
  assignRole: adminOrpc
    .route({
      method: "POST",
      path: "/users/{userId}/roles",
      summary: "Assign role to user",
      description: "Assign a role to a user (admin only)",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        userId: z.number(),
        roleName: z.enum(["admin", "player"]),
      }),
    )
    .handler(async ({ input }) => {
      await query(`SELECT assign_role_to_user($1, $2)`, [
        input.userId,
        input.roleName,
      ]);

      return { success: true };
    }),

  // Admin: Remove role from user
  removeRole: adminOrpc
    .route({
      method: "DELETE",
      path: "/users/{userId}/roles/{roleName}",
      summary: "Remove role from user",
      description: "Remove a role from a user (admin only)",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        userId: z.number(),
        roleName: z.enum(["admin", "player"]),
      }),
    )
    .handler(async ({ input }) => {
      const result = await query(
        `UPDATE role_user ru
         SET status = false
         FROM role r
         WHERE ru.role_id = r.id
           AND ru.user_id = $1
           AND r.name = $2
         RETURNING ru.id`,
        [input.userId, input.roleName],
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Role assignment not found",
        });
      }

      return { success: true };
    }),

  // Authenticated: Get my profile
  me: authedOrpc
    .route({
      method: "GET",
      path: "/users/me",
      summary: "Get my profile",
      description: "Get current user's profile information",
      tags: ["users"],
    })
    .handler(async ({ context }) => {
      const userId = context.user!.id;

      const users = await query(
        `SELECT u.id, u.name, u.short_name, u.status, u.suspension_status,
                u.url_image, u.creation_date,
                COALESCE(
                  json_agg(
                    json_build_object('id', r.id, 'name', r.name, 'description', r.description)
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'
                ) as roles
         FROM users u
         LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.status = true
         LEFT JOIN role r ON ru.role_id = r.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [userId],
      );

      return users[0];
    }),
});

export default usersRouter;
