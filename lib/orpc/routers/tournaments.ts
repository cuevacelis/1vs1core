import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "@/lib/db/config";
import type { Tournament } from "@/lib/db/types";
import { authedMiddleware } from "../middlewares/auth";

const tournamentStateEnum = z.enum([
  "draft",
  "active",
  "in_progress",
  "completed",
  "cancelled",
]);

const tournamentOutputSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  game_id: z.number(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  max_participants: z.number().optional(),
  creator_id: z.number(),
  state: tournamentStateEnum,
  url_image: z.string().optional(),
  creation_date: z.string(),
  modification_date: z.string().optional(),
});

type TournamentState =
  | "draft"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled";

interface TournamentOutput {
  id: number;
  name: string;
  description?: string;
  game_id: number;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  creator_id: number;
  state: TournamentState;
  url_image?: string;
  creation_date: string;
  modification_date?: string;
}

export const tournamentsRouter = {
  // Public: List all active tournaments
  list: authedMiddleware
    .route({
      method: "GET",
      path: "/tournaments",
      summary: "Listar torneos",
      description: "Obtener una lista de torneos con filtro opcional de estado",
      tags: ["tournaments"],
    })
    .input(
      z.object({
        tournament_state: tournamentStateEnum.optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .output(z.array(tournamentOutputSchema))
    .handler(async ({ input }) => {
      const { tournament_state, limit, offset } = input;

      // Use database function fn_tournament_list
      const result = await query<{
        out_tournament: TournamentOutput;
      }>(`SELECT * FROM fn_tournament_list($1, $2, $3)`, [
        tournament_state || null,
        limit,
        offset,
      ]);

      return result.map((row) => row.out_tournament);
    }),

  // Public: Get tournament by ID
  getById: authedMiddleware
    .route({
      method: "GET",
      path: "/tournaments/{id}",
      summary: "Obtener detalles de torneo",
      description: "Obtener información detallada de un torneo específico",
      tags: ["tournaments"],
    })
    .input(z.object({ id: z.number() }))
    .output(tournamentOutputSchema)
    .handler(async ({ input }) => {
      // Use database function fn_tournament_get_by_id
      const result = await query<{
        out_tournament: TournamentOutput | null;
      }>(`SELECT * FROM fn_tournament_get_by_id($1)`, [input.id]);

      if (result.length === 0 || result[0].out_tournament === null) {
        throw new ORPCError("NOT_FOUND", {
          message: "Torneo no encontrado",
        });
      }

      return result[0].out_tournament;
    }),

  // Admin: Create tournament
  create: authedMiddleware
    .route({
      method: "POST",
      path: "/tournaments",
      summary: "Crear torneo",
      description: "Crear un nuevo torneo (solo admin)",
      tags: ["tournaments", "admin"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        game_id: z.number(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        max_participants: z.number().optional(),
        url_image: z.string().optional(),
      }),
    )
    .output(tournamentOutputSchema)
    .handler(async ({ input, context }) => {
      // Use database function fn_tournament_create
      const result = await query<{
        out_tournament: TournamentOutput;
      }>(`SELECT * FROM fn_tournament_create($1, $2, $3, $4, $5, $6, $7, $8)`, [
        input.name,
        input.game_id,
        context?.session?.userId,
        input.description || null,
        input.start_date || null,
        input.end_date || null,
        input.max_participants || null,
        input.url_image || null,
      ]);

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al crear el torneo",
        });
      }

      return result[0].out_tournament;
    }),

  // Admin: Update tournament
  update: authedMiddleware
    .route({
      method: "PATCH",
      path: "/tournaments/{id}",
      summary: "Actualizar torneo",
      description: "Actualizar detalles de un torneo (solo admin)",
      tags: ["tournaments", "admin"],
    })
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        start_date: z.string().optional(),
        end_date: z.string().optional(),
        max_participants: z.number().optional(),
        status: z.boolean().optional(),
        tournament_state: tournamentStateEnum.optional(),
        url_image: z.string().optional(),
      }),
    )
    .output(tournamentOutputSchema)
    .handler(async ({ input }) => {
      const { id, ...updates } = input;
      const setClause: string[] = [];
      const values: (string | number | boolean)[] = [];
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
      const result = await query<Tournament>(
        `UPDATE tournament SET ${setClause.join(
          ", ",
        )} WHERE id = $${paramIndex} RETURNING *`,
        values,
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Torneo no encontrado",
        });
      }

      return result[0];
    }),

  // Authenticated: Join tournament
  join: authedMiddleware
    .route({
      method: "POST",
      path: "/tournaments/{tournamentId}/join",
      summary: "Unirse a torneo",
      description: "Unirse a un torneo como participante",
      tags: ["tournaments", "player"],
    })
    .input(z.object({ tournamentId: z.number() }))
    .output(
      z.object({
        id: z.number(),
        tournament_id: z.number(),
        user_id: z.number(),
        registration_date: z.string(),
        state: z.enum(["registered", "confirmed", "withdrawn"]),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context?.session?.userId;

      // Use database function fn_tournament_join
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_participation: {
          id: number;
          tournament_id: number;
          user_id: number;
          registration_date: string;
          state: "registered" | "confirmed" | "withdrawn";
        } | null;
      }>(`SELECT * FROM fn_tournament_join($1, $2)`, [
        input.tournamentId,
        userId,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("BAD_REQUEST", {
          message: result[0]?.out_message || "Error al unirse al torneo",
        });
      }

      if (!result[0].out_participation) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Error al procesar la participación",
        });
      }

      return result[0].out_participation;
    }),

  // Get tournament participants
  getParticipants: authedMiddleware
    .route({
      method: "GET",
      path: "/tournaments/{tournamentId}/participants",
      summary: "Obtener participantes de torneo",
      description: "Obtener todos los participantes de un torneo específico",
      tags: ["tournaments"],
    })
    .input(z.object({ tournamentId: z.number() }))
    .output(
      z.array(
        z.object({
          id: z.number(),
          tournament_id: z.number(),
          user_id: z.number(),
          user_name: z.string(),
          registration_date: z.string(),
          state: z.enum(["registered", "confirmed", "withdrawn"]),
        }),
      ),
    )
    .handler(async ({ input }) => {
      // Use database function fn_tournament_get_participants
      const result = await query<{
        out_participant: {
          id: number;
          tournament_id: number;
          user_id: number;
          user_name: string;
          registration_date: string;
          state: "registered" | "confirmed" | "withdrawn";
        };
      }>(`SELECT * FROM fn_tournament_get_participants($1)`, [
        input.tournamentId,
      ]);

      return result.map((row) => row.out_participant);
    }),
};
