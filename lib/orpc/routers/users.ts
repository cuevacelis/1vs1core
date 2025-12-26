import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import { authedMiddleware } from "../middlewares/auth";

export const usersRouter = {
  create: authedMiddleware
    .route({
      method: "POST",
      path: "/users",
      summary: "Crear usuario",
      description: "Crear un nuevo usuario con código de acceso auto-generado",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        short_name: z.string().max(50).optional(),
        persona_id: z.number().optional(),
        url_image: z.string().optional(),
        role: z.enum(["admin", "player"]).default("player"),
      }),
    )
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        access_code: z.string(),
        message: z.string(),
      }),
    )
    .handler(async ({ input }) => {
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
        input.role,
      ]);

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create user",
        });
      }

      const newUser = result[0];

      return {
        id: newUser.out_user_id,
        name: newUser.out_user_name,
        access_code: newUser.out_access_code,
        message:
          "IMPORTANTE: Guarda este código de acceso de forma segura. No podrá ser recuperado más tarde.",
      };
    }),

  list: authedMiddleware
    .route({
      method: "GET",
      path: "/users",
      summary: "Listar usuarios",
      description: "Obtener todos los usuarios",
      tags: ["users", "admin"],
    })
    .input(
      z
        .object({
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
          status: z.boolean().optional(),
        })
        .default({ limit: 50, offset: 0 }),
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          short_name: z.string().nullable(),
          state: z.enum([
            "active",
            "suspended",
            "banned",
            "pending_verification",
          ]),
          url_image: z.string().nullable(),
          creation_date: z.string(),
          modification_date: z.string(),
          role: z.object({
            id: z.number(),
            name: z.string(),
            description: z.string().nullable(),
          }),
        }),
      ),
    )
    .handler(async ({ input }) => {
      console.log("users.list handler - input:", input);
      const { limit, offset, status } = input;
      const result = await query<{
        out_user: {
          id: number;
          name: string;
          short_name: string | null;
          state: "active" | "suspended" | "banned" | "pending_verification";
          url_image: string | null;
          creation_date: string;
          modification_date: string;
          role: {
            id: number;
            name: string;
            description: string | null;
          };
        };
      }>(`SELECT * FROM fn_user_list_with_roles($1, $2, $3)`, [
        status,
        limit,
        offset,
      ]);

      return result.map((row) => row.out_user);
    }),

  getById: authedMiddleware
    .route({
      method: "GET",
      path: "/users/{id}",
      summary: "Obtener detalles de usuario",
      description: "Obtener información detallada de un usuario específico",
      tags: ["users", "admin"],
    })
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        short_name: z.string().nullable(),
        state: z.enum([
          "active",
          "suspended",
          "banned",
          "pending_verification",
        ]),
        url_image: z.string().nullable(),
        creation_date: z.string(),
        modification_date: z.string(),
        role: z.object({
          id: z.number(),
          name: z.string(),
          description: z.string().nullable(),
        }),
      }),
    )
    .handler(async ({ input }) => {
      // Use database function fn_user_get_by_id
      const result = await query<{
        fn_user_get_by_id: {
          id: number;
          name: string;
          short_name: string | null;
          state: "active" | "suspended" | "banned" | "pending_verification";
          url_image: string | null;
          creation_date: string;
          modification_date: string;
          role: {
            id: number;
            name: string;
            description: string | null;
          };
        } | null;
      }>(`SELECT fn_user_get_by_id($1)`, [input.id]);

      if (result.length === 0 || result[0].fn_user_get_by_id === null) {
        throw new ORPCError("NOT_FOUND", {
          message: "Usuario no encontrado",
        });
      }

      return result[0].fn_user_get_by_id;
    }),

  update: authedMiddleware
    .route({
      method: "PATCH",
      path: "/users/{id}",
      summary: "Actualizar usuario",
      description: "Actualizar detalles de un usuario",
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
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        short_name: z.string().nullable(),
        state: z.enum([
          "active",
          "suspended",
          "banned",
          "pending_verification",
        ]),
        url_image: z.string().nullable(),
      }),
    )
    .handler(async ({ input }) => {
      const { id, ...updates } = input;
      const setClause: string[] = [];
      const values: (string | number)[] = [];
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
          message: "No hay campos para actualizar",
        });
      }

      values.push(id);
      const result = await query<{
        id: number;
        name: string;
        short_name: string | null;
        state: "active" | "suspended" | "banned" | "pending_verification";
        url_image: string | null;
      }>(
        `UPDATE users SET ${setClause.join(
          ", ",
        )} WHERE id = $${paramIndex} RETURNING id, name, short_name, state, url_image`,
        values,
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Usuario no encontrado",
        });
      }

      return result[0];
    }),

  updateRole: authedMiddleware
    .route({
      method: "PATCH",
      path: "/users/{userId}/role",
      summary: "Actualizar rol de usuario",
      description: "Cambiar el rol de un usuario (solo admin)",
      tags: ["users", "admin"],
    })
    .input(
      z.object({
        userId: z.number(),
        roleName: z.enum(["admin", "player"]),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
      }),
    )
    .handler(async ({ input }) => {
      // Get role_id from role name
      const roleResult = await query<{ id: number }>(
        `SELECT id FROM role WHERE name = $1`,
        [input.roleName],
      );

      if (roleResult.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Rol no encontrado",
        });
      }

      // Update user's role_id
      await query(`UPDATE users SET role_id = $1 WHERE id = $2`, [
        roleResult[0].id,
        input.userId,
      ]);

      return { success: true };
    }),

  me: authedMiddleware
    .route({
      method: "GET",
      path: "/users/me",
      summary: "Obtener mi perfil",
      description: "Obtener información del perfil del usuario actual",
      tags: ["users"],
    })
    .output(
      z
        .object({
          id: z.number(),
          name: z.string(),
          short_name: z.string().nullable(),
          state: z.enum([
            "active",
            "suspended",
            "banned",
            "pending_verification",
          ]),
          url_image: z.string().nullable(),
          creation_date: z.string(),
          modification_date: z.string(),
          role: z.object({
            id: z.number(),
            name: z.string(),
            description: z.string().nullable(),
          }),
          person: z
            .object({
              first_name: z.string(),
              second_name: z.string().nullable(),
              paternal_last_name: z.string(),
              maternal_last_name: z.string().nullable(),
            })
            .nullable(),
        })
        .nullable(),
    )
    .handler(async ({ context }) => {
      const userId = context?.session?.userId;
      const result = await query<{
        out_profile: {
          id: number;
          name: string;
          short_name: string | null;
          state: "active" | "suspended" | "banned" | "pending_verification";
          url_image: string | null;
          creation_date: string;
          modification_date: string;
          role: {
            id: number;
            name: string;
            description: string | null;
          };
          person: {
            first_name: string;
            second_name: string | null;
            paternal_last_name: string;
            maternal_last_name: string | null;
          } | null;
        } | null;
      }>(`SELECT * FROM fn_user_get_profile($1)`, [userId]);

      if (result.length === 0) return null;

      return result[0].out_profile;
    }),

  updateMe: authedMiddleware
    .route({
      method: "PATCH",
      path: "/users/me",
      summary: "Actualizar mi perfil",
      description:
        "Actualizar nombre y nombre corto del usuario autenticado actual",
      tags: ["users"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        short_name: z.string().max(50).optional(),
      }),
    )
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        short_name: z.string().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context?.session?.userId;
      const { name, short_name } = input;

      // Validate that at least one field is provided
      if (name === undefined && short_name === undefined) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Debe proporcionar al menos un campo para actualizar",
        });
      }

      // Build dynamic UPDATE query
      const setClause: string[] = [];
      const values: (string | number | null)[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        setClause.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
      }

      if (short_name !== undefined) {
        setClause.push(`short_name = $${paramIndex}`);
        // Convert empty string to null for database consistency
        values.push(short_name === "" ? null : short_name);
        paramIndex++;
      }

      values.push(userId);
      const result = await query<{
        id: number;
        name: string;
        short_name: string | null;
      }>(
        `UPDATE users SET ${setClause.join(", ")} WHERE id = $${paramIndex} RETURNING id, name, short_name`,
        values,
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Usuario no encontrado",
        });
      }

      return result[0];
    }),

  myStats: authedMiddleware
    .route({
      method: "GET",
      path: "/users/me/stats",
      summary: "Obtener mis estadísticas",
      description:
        "Obtener estadísticas de partidas y rendimiento del usuario actual",
      tags: ["users", "stats"],
    })
    .output(
      z.object({
        totalMatches: z.number(),
        wins: z.number(),
        losses: z.number(),
        winRate: z.number(),
        currentStreak: z.number(),
        tournamentsJoined: z.number(),
      }),
    )
    .handler(async ({ context }) => {
      const userId = context?.session?.userId;
      const result = await query<{
        out_stats: {
          totalMatches: number;
          wins: number;
          losses: number;
          winRate: number;
          currentStreak: number;
          tournamentsJoined: number;
        };
      }>(`SELECT * FROM fn_user_get_statistics($1)`, [userId]);

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

  myRecentMatches: authedMiddleware
    .route({
      method: "GET",
      path: "/users/me/matches",
      summary: "Obtener mis partidas recientes",
      description: "Obtener historial de partidas recientes del usuario actual",
      tags: ["users", "matches"],
    })
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          tournament_id: z.number(),
          tournament_name: z.string(),
          round: z.number(),
          player1_id: z.number(),
          player1_name: z.string(),
          player2_id: z.number(),
          player2_name: z.string(),
          winner_id: z.number().nullable(),
          winner_name: z.string().nullable(),
          match_date: z.string().nullable(),
          state: z.enum([
            "pending",
            "active",
            "player1_connected",
            "player2_connected",
            "both_connected",
            "in_selection",
            "locked",
            "completed",
            "cancelled",
          ]),
          creation_date: z.string(),
          modification_date: z.string().nullable(),
          player1_champion_id: z.number().nullable(),
          player1_champion_name: z.string().nullable(),
          player2_champion_id: z.number().nullable(),
          player2_champion_name: z.string().nullable(),
          opponent_name: z.string(),
          my_champion: z.string().nullable(),
          result: z.string(),
        }),
      ),
    )
    .handler(async ({ context, input }) => {
      const userId = context?.session?.userId;
      const result = await query<{
        out_match: {
          id: number;
          tournament_id: number;
          tournament_name: string;
          round: number;
          player1_id: number;
          player1_name: string;
          player2_id: number;
          player2_name: string;
          winner_id: number | null;
          winner_name: string | null;
          match_date: string | null;
          state:
            | "pending"
            | "active"
            | "player1_connected"
            | "player2_connected"
            | "both_connected"
            | "in_selection"
            | "locked"
            | "completed"
            | "cancelled";
          creation_date: string;
          modification_date: string | null;
          player1_champion_id: number | null;
          player1_champion_name: string | null;
          player2_champion_id: number | null;
          player2_champion_name: string | null;
          opponent_name: string;
          my_champion: string | null;
          result: string;
        };
      }>(`SELECT * FROM fn_user_get_recent_matches($1, $2, $3)`, [
        userId,
        input.limit,
        input.offset,
      ]);

      return result.map((row) => row.out_match);
    }),

  myTournaments: authedMiddleware
    .route({
      method: "GET",
      path: "/users/me/tournaments",
      summary: "Obtener mis torneos",
      description:
        "Obtener torneos en los que el usuario actual está participando",
      tags: ["users", "tournaments"],
    })
    .input(
      z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }),
    )
    .output(
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          description: z.string().nullable(),
          game_id: z.number(),
          game_name: z.string(),
          start_date: z.string().nullable(),
          end_date: z.string().nullable(),
          max_participants: z.number().nullable(),
          creator_id: z.number(),
          state: z.enum([
            "draft",
            "active",
            "in_progress",
            "completed",
            "cancelled",
          ]),
          tournament_state: z.enum([
            "draft",
            "active",
            "in_progress",
            "completed",
            "cancelled",
          ]),
          url_image: z.string().nullable(),
          creation_date: z.string(),
          modification_date: z.string().nullable(),
          registration_date: z.string().nullable(),
          participation_state: z.string().nullable(),
        }),
      ),
    )
    .handler(async ({ context, input }) => {
      const userId = context?.session?.userId;

      // Use database function fn_user_get_tournaments
      const result = await query<{
        out_tournament: {
          id: number;
          name: string;
          description: string | null;
          game_id: number;
          game_name: string;
          start_date: string | null;
          end_date: string | null;
          max_participants: number | null;
          creator_id: number;
          state: "draft" | "active" | "in_progress" | "completed" | "cancelled";
          tournament_state:
            | "draft"
            | "active"
            | "in_progress"
            | "completed"
            | "cancelled";
          url_image: string | null;
          creation_date: string;
          modification_date: string | null;
          registration_date: string | null;
          participation_state: string | null;
        };
      }>(`SELECT * FROM fn_user_get_tournaments($1, $2, $3)`, [
        userId,
        input.limit,
        input.offset,
      ]);

      return result.map((row) => row.out_tournament);
    }),

  // Authenticated: Get navigation items for current user
  myNavigation: authedMiddleware
    .route({
      method: "GET",
      path: "/users/me/navigation",
      summary: "Obtener mis elementos de navegación",
      description:
        "Obtener elementos del menú de navegación basados en los roles activos del usuario",
      tags: ["users", "navigation"],
    })
    .output(
      z.array(
        z.object({
          title: z.string(),
          href: z.string(),
          icon: z.string(),
          display_order: z.number(),
        }),
      ),
    )
    .handler(async ({ context }) => {
      const userId = context?.session?.userId;

      // Use database function fn_navigation_get_items_for_user
      const result = await query<{
        title: string;
        href: string;
        icon: string;
        display_order: number;
      }>(`SELECT * FROM fn_navigation_get_items_for_user($1)`, [userId]);

      return result;
    }),

  // Admin: Delete user
  delete: authedMiddleware
    .route({
      method: "DELETE",
      path: "/users/{id}",
      summary: "Eliminar usuario",
      description: "Eliminar un usuario (solo admin)",
      tags: ["users", "admin"],
    })
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      // Delete user
      const result = await query<{ id: number }>(
        `DELETE FROM users WHERE id = $1 RETURNING id`,
        [input.id],
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Usuario no encontrado",
        });
      }

      return {
        success: true,
        message: "Usuario eliminado exitosamente",
      };
    }),
};
