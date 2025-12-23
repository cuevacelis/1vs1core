import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import { authedMiddleware } from "../middlewares/auth";

const matchStateEnum = z.enum([
  "pending",
  "active",
  "player1_connected",
  "player2_connected",
  "both_connected",
  "in_selection",
  "locked",
  "completed",
  "cancelled",
]);

const matchOutputSchema = z.object({
  id: z.number(),
  tournament_id: z.number(),
  round: z.number(),
  player1_id: z.number(),
  player2_id: z.number(),
  winner_id: z.number().nullable(),
  match_date: z.string().nullable(),
  state: matchStateEnum,
  creation_date: z.string(),
  modification_date: z.string().nullable(),
});

type MatchState =
  | "pending"
  | "active"
  | "player1_connected"
  | "player2_connected"
  | "both_connected"
  | "in_selection"
  | "locked"
  | "completed"
  | "cancelled";

interface MatchOutput {
  id: number;
  tournament_id: number;
  round: number;
  player1_id: number;
  player2_id: number;
  winner_id: number | null;
  match_date: string | null;
  state: MatchState;
  creation_date: string;
  modification_date: string | null;
}

export const matchesRouter = {
  // Get matches for a tournament
  listByTournament: authedMiddleware
    .route({
      method: "GET",
      path: "/matches/tournament/{tournamentId}",
      summary: "Listar partidas de torneo",
      description: "Obtener todas las partidas para un torneo específico",
      tags: ["matches", "tournament"],
    })
    .input(z.object({ tournamentId: z.number() }))
    .output(z.array(matchOutputSchema))
    .handler(async ({ input }) => {
      // Use database function fn_match_list_by_tournament
      const result = await query<{
        out_match: MatchOutput;
      }>(`SELECT * FROM fn_match_list_by_tournament($1)`, [input.tournamentId]);

      return result.map((row) => row.out_match);
    }),

  // Get match by ID
  getById: authedMiddleware
    .route({
      method: "GET",
      path: "/matches/{id}",
      summary: "Obtener detalles de partida",
      description: "Obtener información detallada de una partida específica",
      tags: ["matches"],
    })
    .input(z.object({ id: z.number() }))
    .output(matchOutputSchema)
    .handler(async ({ input }) => {
      // Use database function fn_match_get_by_id
      const result = await query<{
        out_match: MatchOutput | null;
      }>(`SELECT * FROM fn_match_get_by_id($1)`, [input.id]);

      if (result.length === 0 || result[0].out_match === null) {
        throw new ORPCError("NOT_FOUND", {
          message: "Partida no encontrada",
        });
      }

      return result[0].out_match;
    }),

  // Admin: Create matches for a tournament (bracket generation)
  generateMatches: authedMiddleware
    .route({
      method: "POST",
      path: "/matches/generate",
      summary: "Generar bracket de torneo",
      description:
        "Generar partidas para un torneo basado en participantes (solo admin)",
      tags: ["matches", "tournament", "admin"],
    })
    .input(
      z.object({
        tournamentId: z.number(),
        round: z.number().default(1),
      }),
    )
    .output(z.array(matchOutputSchema))
    .handler(async ({ input }) => {
      // Use database function fn_match_generate_for_tournament
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_matches: MatchOutput[];
      }>(`SELECT * FROM fn_match_generate_for_tournament($1, $2)`, [
        input.tournamentId,
        input.round,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("BAD_REQUEST", {
          message: result[0]?.out_message || "Error al generar partidas",
        });
      }

      return result[0].out_matches;
    }),

  // Admin: Activate a match (generate access codes for players)
  activateMatch: authedMiddleware
    .route({
      method: "POST",
      path: "/matches/{matchId}/activate",
      summary: "Activar partida",
      description:
        "Activar una partida para hacerla disponible para jugadores (solo admin)",
      tags: ["matches", "admin"],
    })
    .input(z.object({ matchId: z.number() }))
    .output(matchOutputSchema)
    .handler(async ({ input }) => {
      // Use database function fn_match_activate
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_match: MatchOutput | null;
      }>(`SELECT * FROM fn_match_activate($1)`, [input.matchId]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("NOT_FOUND", {
          message:
            result[0]?.out_message || "Partida no encontrada o ya activa",
        });
      }

      if (!result[0].out_match) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al activar la partida",
        });
      }

      return result[0].out_match;
    }),

  // Player: Get active match for current user
  getMyActiveMatch: authedMiddleware
    .route({
      method: "GET",
      path: "/matches/my-active",
      summary: "Obtener mi partida activa",
      description: "Obtener la partida activa del usuario actual",
      tags: ["matches", "player"],
    })
    .output(
      matchOutputSchema
        .extend({
          player1_name: z.string(),
          player2_name: z.string(),
          tournament_name: z.string(),
        })
        .nullable(),
    )
    .handler(async ({ context }) => {
      const userId = context?.session?.userId;

      // Use database function fn_match_get_active_for_user
      const result = await query<{
        out_match:
          | (MatchOutput & {
              player1_name: string;
              player2_name: string;
              tournament_name: string;
            })
          | null;
      }>(`SELECT * FROM fn_match_get_active_for_user($1)`, [userId]);

      return result.length > 0 ? result[0].out_match : null;
    }),

  // Player: Connect to match
  connectToMatch: authedMiddleware
    .route({
      method: "POST",
      path: "/matches/{matchId}/connect",
      summary: "Conectar a partida",
      description: "Conectarse a una partida como jugador",
      tags: ["matches", "player"],
    })
    .input(z.object({ matchId: z.number() }))
    .output(matchOutputSchema)
    .handler(async ({ input, context }) => {
      const userId = context?.session?.userId;

      // Use database function fn_match_connect
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_match: MatchOutput | null;
      }>(`SELECT * FROM fn_match_connect($1, $2)`, [input.matchId, userId]);

      if (result.length === 0 || !result[0].out_success) {
        const message =
          result[0]?.out_message || "Error al conectar a la partida";

        if (message.includes("No eres parte")) {
          throw new ORPCError("FORBIDDEN", { message });
        } else if (message.includes("no encontrada")) {
          throw new ORPCError("NOT_FOUND", { message });
        } else {
          throw new ORPCError("BAD_REQUEST", { message });
        }
      }

      if (!result[0].out_match) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al procesar la conexión",
        });
      }

      return result[0].out_match;
    }),

  // Admin: Complete match
  completeMatch: authedMiddleware
    .route({
      method: "POST",
      path: "/matches/{matchId}/complete",
      summary: "Completar partida",
      description:
        "Marcar una partida como completada con un ganador (solo admin)",
      tags: ["matches", "admin"],
    })
    .input(
      z.object({
        matchId: z.number(),
        winnerId: z.number(),
      }),
    )
    .output(matchOutputSchema)
    .handler(async ({ input }) => {
      // Use database function fn_match_complete
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_match: MatchOutput | null;
      }>(`SELECT * FROM fn_match_complete($1, $2)`, [
        input.matchId,
        input.winnerId,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("NOT_FOUND", {
          message: result[0]?.out_message || "Partida no encontrada",
        });
      }

      if (!result[0].out_match) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al completar la partida",
        });
      }

      return result[0].out_match;
    }),
};
