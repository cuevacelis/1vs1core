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
      })
    )
    .handler(async ({ input }) => {
      // Create user with auto-generated access code
      const result = await query<{
        out_user_id: number;
        out_access_code: string;
        out_user_name: string;
        out_assigned_role: string;
      }>(`SELECT * FROM fn_user_create_with_access_code($1, $2, $3, $4, $5)`, [
        input.name,
        input.short_name,
        input.persona_id,
        input.url_image,
        input.roles[0] || "player", // Pass first role to the function
      ]);

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create user",
        });
      }

      const newUser = result[0];

      // Assign additional roles if provided
      for (let i = 1; i < input.roles.length; i++) {
        await query(`SELECT fn_role_assign_to_user($1, $2)`, [
          newUser.out_user_id,
          input.roles[i],
        ]);
      }

      return {
        id: newUser.out_user_id,
        name: newUser.out_user_name,
        access_code: newUser.out_access_code,
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
      })
    )
    .handler(async ({ input }) => {
      const { limit, offset, status } = input;

      // Use database function fn_user_list_with_roles
      const result = await query<{ out_user: object }>(
        `SELECT * FROM fn_user_list_with_roles($1, $2, $3)`,
        [status, limit, offset]
      );

      return result.map((row) => row.out_user);
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
        `SELECT u.id, u.name, u.short_name, u.state,
                u.url_image, u.creation_date, u.modification_date,
                COALESCE(
                  json_agg(
                    json_build_object('id', r.id, 'name', r.name, 'description', r.description)
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'
                ) as roles
         FROM users u
         LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.state = 'active'
         LEFT JOIN role r ON ru.role_id = r.id
         WHERE u.id = $1
         GROUP BY u.id`,
        [input.id]
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
        state: z
          .enum(["active", "suspended", "banned", "pending_verification"])
          .optional(),
        url_image: z.string().optional(),
      })
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
          ", "
        )} WHERE id = $${paramIndex} RETURNING *`,
        values
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
      })
    )
    .handler(async ({ input }) => {
      await query(`SELECT fn_role_assign_to_user($1, $2)`, [
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
      })
    )
    .handler(async ({ input }) => {
      const result = await query(
        `UPDATE role_user ru
         SET state = 'inactive'
         FROM role r
         WHERE ru.role_id = r.id
           AND ru.user_id = $1
           AND r.name = $2
         RETURNING ru.id`,
        [input.userId, input.roleName]
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
      const userId = context.user?.id;

      // Use database function fn_user_get_profile
      const result = await query<{ out_profile: object }>(
        `SELECT * FROM fn_user_get_profile($1)`,
        [userId]
      );

      if (result.length === 0) return null;

      return result[0].out_profile;
    }),

  // Authenticated: Get my statistics
  myStats: authedOrpc
    .route({
      method: "GET",
      path: "/users/me/stats",
      summary: "Get my statistics",
      description: "Get current user's match statistics and performance",
      tags: ["users", "stats"],
    })
    .handler(async ({ context }) => {
      const userId = context.user!.id;

      // Use database function fn_user_get_statistics
      const result = await query<{ out_stats: object }>(
        `SELECT * FROM fn_user_get_statistics($1)`,
        [userId]
      );

      if (result.length === 0) {
        return {
          totalMatches: 0,
          wins: 0,
          losses: 0,
          winRate: 0,
          currentStreak: 0,
          tournamentsJoined: 0,
        };
      }

      return result[0].out_stats;
    }),

  // Authenticated: Get my recent matches
  myRecentMatches: authedOrpc
    .route({
      method: "GET",
      path: "/users/me/matches",
      summary: "Get my recent matches",
      description: "Get current user's recent match history",
      tags: ["users", "matches"],
    })
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.user?.id;

      // Use database function fn_user_get_recent_matches
      const result = await query<{ out_match: object }>(
        `SELECT * FROM fn_user_get_recent_matches($1, $2, $3)`,
        [userId, input.limit, input.offset]
      );

      return result.map((row) => row.out_match);
    }),

  // Authenticated: Get my tournaments
  myTournaments: authedOrpc
    .route({
      method: "GET",
      path: "/users/me/tournaments",
      summary: "Get my tournaments",
      description: "Get tournaments the current user is participating in",
      tags: ["users", "tournaments"],
    })
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ context, input }) => {
      const userId = context.user?.id;

      // Use database function fn_user_get_tournaments
      const result = await query<{ out_tournament: object }>(
        `SELECT * FROM fn_user_get_tournaments($1, $2, $3)`,
        [userId, input.limit, input.offset]
      );

      return result.map((row) => row.out_tournament);
    }),

  // Authenticated: Get navigation items for current user
  myNavigation: authedOrpc
    .route({
      method: "GET",
      path: "/users/me/navigation",
      summary: "Get my navigation items",
      description: "Get navigation menu items based on user's active roles",
      tags: ["users", "navigation"],
    })
    .handler(async ({ context }) => {
      const userId = context.user?.id;

      // Use database function fn_navigation_get_items_for_user
      const result = await query<{
        title: string;
        href: string;
        icon: string;
        display_order: number;
      }>(`SELECT * FROM fn_navigation_get_items_for_user($1)`, [userId]);

      return result;
    }),
});

export default usersRouter;
