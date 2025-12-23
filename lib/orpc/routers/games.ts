import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import { authedMiddleware } from "../middlewares/auth";

export const gamesRouter = {
  // List all games
  list: authedMiddleware
    .route({
      method: "GET",
      path: "/games",
      summary: "Listar juegos",
      description: "Obtener todos los juegos activos",
      tags: ["games"],
    })
    .output(
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          type: z.string(),
          description: z.string().nullable(),
          state: z.enum(["active", "inactive"]),
          creation_date: z.string(),
        }),
      ),
    )
    .handler(async () => {
      // Use database function fn_game_list
      const result = await query<{
        out_game: {
          id: number;
          name: string;
          type: string;
          description: string | null;
          state: "active" | "inactive";
          creation_date: string;
        };
      }>(`SELECT * FROM fn_game_list()`);

      return result.map((row) => row.out_game);
    }),

  // Get game by ID
  getById: authedMiddleware
    .route({
      method: "GET",
      path: "/games/{id}",
      summary: "Obtener detalles de juego",
      description: "Obtener información detallada de un juego específico",
      tags: ["games"],
    })
    .input(z.object({ id: z.number() }))
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        type: z.string(),
        description: z.string().nullable(),
        state: z.enum(["active", "inactive"]),
        creation_date: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      // Use database function fn_game_get_by_id
      const result = await query<{
        out_game: {
          id: number;
          name: string;
          type: string;
          description: string | null;
          state: "active" | "inactive";
          creation_date: string;
        } | null;
      }>(`SELECT * FROM fn_game_get_by_id($1)`, [input.id]);

      if (result.length === 0 || result[0].out_game === null) {
        throw new ORPCError("NOT_FOUND", {
          message: "Juego no encontrado",
        });
      }

      return result[0].out_game;
    }),

  // Admin: Create game
  create: authedMiddleware
    .route({
      method: "POST",
      path: "/games",
      summary: "Crear juego",
      description: "Crear un nuevo juego (solo admin)",
      tags: ["games", "admin"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.string().min(1).max(50),
        description: z.string().optional(),
      }),
    )
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        type: z.string(),
        description: z.string().nullable(),
        state: z.enum(["active", "inactive"]),
        creation_date: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      // Use database function fn_game_create
      const result = await query<{
        out_game: {
          id: number;
          name: string;
          type: string;
          description: string | null;
          state: "active" | "inactive";
          creation_date: string;
        };
      }>(`SELECT * FROM fn_game_create($1, $2, $3)`, [
        input.name,
        input.type,
        input.description || null,
      ]);

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al crear el juego",
        });
      }

      return result[0].out_game;
    }),
};
