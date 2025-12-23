import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import { authedMiddleware } from "../middlewares/auth";

export const championsRouter = {
  // Get champions by game
  listByGame: authedMiddleware
    .route({
      method: "GET",
      path: "/champions/game/{gameId}",
      summary: "Listar campeones por juego",
      description:
        "Retorna todos los campeones activos para un juego específico",
      tags: ["champions"],
    })
    .input(z.object({ gameId: z.number() }))
    .output(
      z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          game_id: z.number(),
          description: z.string().nullable(),
          url_image: z.string().nullable(),
          state: z.enum(["active", "inactive"]),
          creation_date: z.string(),
        }),
      ),
    )
    .handler(async ({ input }) => {
      // Use database function fn_champion_list_by_game
      const result = await query<{
        out_champion: {
          id: number;
          name: string;
          game_id: number;
          description: string | null;
          url_image: string | null;
          state: "active" | "inactive";
          creation_date: string;
        };
      }>(`SELECT * FROM fn_champion_list_by_game($1)`, [input.gameId]);

      return result.map((row) => row.out_champion);
    }),

  // Admin: Create champion
  create: authedMiddleware
    .route({
      method: "POST",
      path: "/champions",
      summary: "Crear campeón",
      description: "Crear un nuevo campeón (solo admin)",
      tags: ["champions", "admin"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        game_id: z.number(),
        description: z.string().optional(),
        url_image: z.string().optional(),
      }),
    )
    .output(
      z.object({
        id: z.number(),
        name: z.string(),
        game_id: z.number(),
        description: z.string().nullable(),
        url_image: z.string().nullable(),
        state: z.enum(["active", "inactive"]),
        creation_date: z.string(),
      }),
    )
    .handler(async ({ input }) => {
      // Use database function fn_champion_create
      const result = await query<{
        out_champion: {
          id: number;
          name: string;
          game_id: number;
          description: string | null;
          url_image: string | null;
          state: "active" | "inactive";
          creation_date: string;
        };
      }>(`SELECT * FROM fn_champion_create($1, $2, $3, $4)`, [
        input.name,
        input.game_id,
        input.description || null,
        input.url_image || null,
      ]);

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al crear el campeón",
        });
      }

      return result[0].out_champion;
    }),

  // Player: Select champion for match
  selectChampion: authedMiddleware
    .route({
      method: "POST",
      path: "/champions/select",
      summary: "Seleccionar campeón",
      description:
        "Seleccionar un campeón para una partida (vista previa en tiempo real)",
      tags: ["champions", "match"],
    })
    .input(
      z.object({
        matchId: z.number(),
        championId: z.number(),
        role: z.string().optional(),
      }),
    )
    .output(
      z.object({
        id: z.number(),
        match_id: z.number(),
        player_id: z.number(),
        champion_id: z.number(),
        role: z.string().nullable(),
        is_locked: z.boolean(),
        selection_date: z.string(),
        lock_date: z.string().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context?.session?.userId;

      // Use database function fn_champion_select
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_selection: {
          id: number;
          match_id: number;
          player_id: number;
          champion_id: number;
          role: string | null;
          is_locked: boolean;
          selection_date: string;
          lock_date: string | null;
        } | null;
      }>(`SELECT * FROM fn_champion_select($1, $2, $3, $4)`, [
        input.matchId,
        userId,
        input.championId,
        input.role || null,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        const message =
          result[0]?.out_message || "Error al seleccionar campeón";

        if (message.includes("No eres parte")) {
          throw new ORPCError("FORBIDDEN", { message });
        } else if (message.includes("no encontrada")) {
          throw new ORPCError("NOT_FOUND", { message });
        } else if (message.includes("bloqueada")) {
          throw new ORPCError("FORBIDDEN", { message });
        } else {
          throw new ORPCError("BAD_REQUEST", { message });
        }
      }

      if (!result[0].out_selection) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al procesar la selección",
        });
      }

      return result[0].out_selection;
    }),

  // Player: Lock champion selection
  lockSelection: authedMiddleware
    .route({
      method: "POST",
      path: "/champions/lock",
      summary: "Bloquear selección de campeón",
      description:
        "Confirmar y bloquear la selección de campeón para una partida",
      tags: ["champions", "match"],
    })
    .input(z.object({ matchId: z.number() }))
    .output(
      z.object({
        id: z.number(),
        match_id: z.number(),
        player_id: z.number(),
        champion_id: z.number(),
        role: z.string().nullable(),
        is_locked: z.boolean(),
        selection_date: z.string(),
        lock_date: z.string().nullable(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context?.session?.userId;

      // Use database function fn_champion_lock_selection
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_selection: {
          id: number;
          match_id: number;
          player_id: number;
          champion_id: number;
          role: string | null;
          is_locked: boolean;
          selection_date: string;
          lock_date: string | null;
        } | null;
      }>(`SELECT * FROM fn_champion_lock_selection($1, $2)`, [
        input.matchId,
        userId,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("BAD_REQUEST", {
          message: result[0]?.out_message || "No hay campeón seleccionado",
        });
      }

      if (!result[0].out_selection) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al bloquear la selección",
        });
      }

      return result[0].out_selection;
    }),

  // Get champion selections for a match
  getMatchSelections: authedMiddleware
    .route({
      method: "GET",
      path: "/champions/match/{matchId}",
      summary: "Obtener selecciones de campeones de partida",
      description:
        "Obtener todas las selecciones de campeones para una partida específica",
      tags: ["champions", "match"],
    })
    .input(z.object({ matchId: z.number() }))
    .output(
      z.array(
        z.object({
          id: z.number(),
          match_id: z.number(),
          player_id: z.number(),
          champion_id: z.number(),
          role: z.string().nullable(),
          is_locked: z.boolean(),
          selection_date: z.string(),
          lock_date: z.string().nullable(),
        }),
      ),
    )
    .handler(async ({ input }) => {
      // Use database function fn_champion_get_match_selections
      const result = await query<{
        out_selection: {
          id: number;
          match_id: number;
          player_id: number;
          champion_id: number;
          role: string | null;
          is_locked: boolean;
          selection_date: string;
          lock_date: string | null;
        };
      }>(`SELECT * FROM fn_champion_get_match_selections($1)`, [input.matchId]);

      return result.map((row) => row.out_selection);
    }),
};
