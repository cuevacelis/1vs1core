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
      }),
    )
    .handler(async ({ input }) => {
      const { limit, offset, status } = input;

      let queryText = `
        SELECT u.id, u.name, u.short_name, u.state,
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
      `;

      const params: any[] = [];

      if (status !== undefined) {
        queryText += ` WHERE u.state = $1`;
        params.push(status ? "active" : "inactive");
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
        state: z
          .enum(["active", "suspended", "banned", "pending_verification"])
          .optional(),
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
      }),
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
        `SELECT u.id, u.name, u.short_name, u.state,
                u.url_image, u.creation_date,
                p.first_name, p.second_name, p.paternal_last_name, p.maternal_last_name,
                COALESCE(
                  json_agg(
                    json_build_object('id', r.id, 'name', r.name, 'description', r.description)
                  ) FILTER (WHERE r.id IS NOT NULL),
                  '[]'
                ) as roles
         FROM users u
         LEFT JOIN role_user ru ON u.id = ru.user_id AND ru.state = 'active'
         LEFT JOIN role r ON ru.role_id = r.id
         LEFT JOIN person p ON u.persona_id = p.id
         WHERE u.id = $1
         GROUP BY u.id, p.id`,
        [userId],
      );

      const user = users[0];
      if (!user) return null;

      // Structure the response with person data nested
      return {
        id: user.id,
        name: user.name,
        short_name: user.short_name,
        state: user.state,
        url_image: user.url_image,
        creation_date: user.creation_date,
        roles: user.roles,
        person: user.first_name
          ? {
              first_name: user.first_name,
              second_name: user.second_name,
              paternal_last_name: user.paternal_last_name,
              maternal_last_name: user.maternal_last_name,
            }
          : null,
      };
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

      // Get total matches played
      const totalMatchesResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM match
         WHERE (player1_id = $1 OR player2_id = $1)
         AND state = 'completed'`,
        [userId],
      );

      // Get wins and losses
      const winsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM match
         WHERE winner_id = $1
         AND state = 'completed'`,
        [userId],
      );

      // Get tournaments joined
      const tournamentsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count
         FROM tournament_participations
         WHERE user_id = $1
         AND state = 'confirmed'`,
        [userId],
      );

      // Get recent matches for streak calculation
      const recentMatches = await query<{
        id: number;
        winner_id: number | null;
      }>(
        `SELECT id, winner_id
         FROM match
         WHERE (player1_id = $1 OR player2_id = $1)
         AND state = 'completed'
         ORDER BY match_date DESC
         LIMIT 10`,
        [userId],
      );

      const totalMatches = parseInt(totalMatchesResult[0]?.count || "0", 10);
      const wins = parseInt(winsResult[0]?.count || "0", 10);
      const losses = totalMatches - wins;
      const winRate = totalMatches > 0 ? (wins / totalMatches) * 100 : 0;

      // Calculate current streak
      let currentStreak = 0;
      for (const match of recentMatches) {
        if (match.winner_id === userId) {
          currentStreak++;
        } else {
          break;
        }
      }

      return {
        totalMatches,
        wins,
        losses,
        winRate: Math.round(winRate),
        currentStreak,
        tournamentsJoined: parseInt(tournamentsResult[0]?.count || "0", 10),
      };
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
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.user!.id;

      const matches = await query(
        `SELECT m.*,
                t.name as tournament_name,
                p1.name as player1_name,
                p2.name as player2_name,
                w.name as winner_name,
                mc1.champion_id as player1_champion_id,
                mc2.champion_id as player2_champion_id,
                c1.name as player1_champion_name,
                c2.name as player2_champion_name
         FROM match m
         INNER JOIN tournament t ON m.tournament_id = t.id
         INNER JOIN users p1 ON m.player1_id = p1.id
         INNER JOIN users p2 ON m.player2_id = p2.id
         LEFT JOIN users w ON m.winner_id = w.id
         LEFT JOIN match_champions mc1 ON m.id = mc1.match_id AND mc1.player_id = m.player1_id
         LEFT JOIN match_champions mc2 ON m.id = mc2.match_id AND mc2.player_id = m.player2_id
         LEFT JOIN champion c1 ON mc1.champion_id = c1.id
         LEFT JOIN champion c2 ON mc2.champion_id = c2.id
         WHERE (m.player1_id = $1 OR m.player2_id = $1)
         AND m.state = 'completed'
         ORDER BY m.match_date DESC
         LIMIT $2 OFFSET $3`,
        [userId, input.limit, input.offset],
      );

      return matches.map((match) => ({
        ...match,
        opponent_name:
          match.player1_id === userId ? match.player2_name : match.player1_name,
        my_champion:
          match.player1_id === userId
            ? match.player1_champion_name
            : match.player2_champion_name,
        result: match.winner_id === userId ? "Victoria" : "Derrota",
      }));
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
      }),
    )
    .handler(async ({ context, input }) => {
      const userId = context.user!.id;

      const tournaments = await query(
        `SELECT t.*,
                tp.registration_date,
                tp.state as participation_state,
                g.name as game_name
         FROM tournament_participations tp
         INNER JOIN tournament t ON tp.tournament_id = t.id
         INNER JOIN game g ON t.game_id = g.id
         WHERE tp.user_id = $1
         ORDER BY tp.registration_date DESC
         LIMIT $2 OFFSET $3`,
        [userId, input.limit, input.offset],
      );

      return tournaments;
    }),
});

export default usersRouter;
