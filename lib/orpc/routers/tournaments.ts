import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import { Game, type Tournament, TournamentWithGame } from "../../db/types";
import { adminOrpc, authedOrpc, orpc } from "../server";

const tournamentsRouter = orpc.router({
  // Public: List all active tournaments
  list: orpc
    .route({
      method: "GET",
      path: "/tournaments",
      summary: "List tournaments",
      description: "Get a list of tournaments with optional status filter",
      tags: ["tournaments"],
    })
    .input(
      z.object({
        tournament_state: z
          .enum(["draft", "active", "in_progress", "completed", "cancelled"])
          .optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .handler(async ({ input }) => {
      const { tournament_state, limit, offset } = input;

      // Use database function fn_tournament_list
      const result = await query<{ out_tournament: object }>(
        `SELECT * FROM fn_tournament_list($1, $2, $3)`,
        [tournament_state || null, limit, offset]
      );

      return result.map((row) => row.out_tournament);
    }),

  // Public: Get tournament by ID
  getById: orpc
    .route({
      method: "GET",
      path: "/tournaments/{id}",
      summary: "Get tournament details",
      description: "Get detailed information about a specific tournament",
      tags: ["tournaments"],
    })
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      // Use database function fn_tournament_get_by_id
      const result = await query<{ out_tournament: object }>(
        `SELECT * FROM fn_tournament_get_by_id($1)`,
        [input.id]
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Tournament not found",
        });
      }

      return result[0].out_tournament;
    }),

  // Admin: Create tournament
  create: adminOrpc
    .route({
      method: "POST",
      path: "/tournaments",
      summary: "Create tournament",
      description: "Create a new tournament (admin only)",
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
      })
    )
    .handler(async ({ input, context }) => {
      // Use database function fn_tournament_create
      const result = await query<{ out_tournament: object }>(
        `SELECT * FROM fn_tournament_create($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          input.name,
          input.game_id,
          context.user?.id,
          input.description || null,
          input.start_date || null,
          input.end_date || null,
          input.max_participants || null,
          input.url_image || null,
        ]
      );

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create tournament",
        });
      }

      return result[0].out_tournament;
    }),

  // Admin: Update tournament
  update: adminOrpc
    .route({
      method: "PATCH",
      path: "/tournaments/{id}",
      summary: "Update tournament",
      description: "Update tournament details (admin only)",
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
        tournament_state: z
          .enum(["draft", "active", "in_progress", "completed", "cancelled"])
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
      const result = await query<Tournament>(
        `UPDATE tournament SET ${setClause.join(
          ", "
        )} WHERE id = $${paramIndex} RETURNING *`,
        values
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Tournament not found",
        });
      }

      return result[0];
    }),

  // Authenticated: Join tournament
  join: authedOrpc
    .route({
      method: "POST",
      path: "/tournaments/{tournamentId}/join",
      summary: "Join tournament",
      description: "Join a tournament as a participant",
      tags: ["tournaments", "player"],
    })
    .input(z.object({ tournamentId: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.user?.id;

      // Use database function fn_tournament_join
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_participation: object | null;
      }>(`SELECT * FROM fn_tournament_join($1, $2)`, [
        input.tournamentId,
        userId,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("BAD_REQUEST", {
          message: result[0]?.out_message || "Failed to join tournament",
        });
      }

      return result[0].out_participation;
    }),

  // Get tournament participants
  getParticipants: orpc
    .route({
      method: "GET",
      path: "/tournaments/{tournamentId}/participants",
      summary: "Get tournament participants",
      description: "Get all participants for a specific tournament",
      tags: ["tournaments"],
    })
    .input(z.object({ tournamentId: z.number() }))
    .handler(async ({ input }) => {
      // Use database function fn_tournament_get_participants
      const result = await query<{ out_participant: object }>(
        `SELECT * FROM fn_tournament_get_participants($1)`,
        [input.tournamentId]
      );

      return result.map((row) => row.out_participant);
    }),
});

export default tournamentsRouter;
