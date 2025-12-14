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
      }),
    )
    .handler(async ({ input }) => {
      const { tournament_state, limit, offset } = input;

      let queryText = `
        SELECT t.*,
               g.name as game_name, g.type as game_type
        FROM tournament t
        INNER JOIN game g ON t.game_id = g.id
      `;

      const params: any[] = [];
      if (tournament_state) {
        queryText += ` WHERE t.tournament_state = $1`;
        params.push(tournament_state);
      }

      queryText += ` ORDER BY t.creation_date DESC LIMIT $${
        params.length + 1
      } OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const tournaments = await query<
        Tournament & { game_name: string; game_type: string }
      >(queryText, params);

      return tournaments;
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
      const tournaments = await query<
        Tournament & { game_name: string; game_type: string }
      >(
        `SELECT t.*,
                g.name as game_name, g.type as game_type
         FROM tournament t
         INNER JOIN game g ON t.game_id = g.id
         WHERE t.id = $1`,
        [input.id],
      );

      if (tournaments.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Tournament not found",
        });
      }

      return tournaments[0];
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
      }),
    )
    .handler(async ({ input, context }) => {
      const result = await query<Tournament>(
        `INSERT INTO tournament (name, description, game_id, start_date, end_date, max_participants, creator_id, url_image, status, tournament_state)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 'draft')
         RETURNING *`,
        [
          input.name,
          input.description,
          input.game_id,
          input.start_date,
          input.end_date,
          input.max_participants,
          context.user!.id,
          input.url_image,
        ],
      );

      return result[0];
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
      const result = await query<Tournament>(
        `UPDATE tournament SET ${setClause.join(
          ", ",
        )} WHERE id = $${paramIndex} RETURNING *`,
        values,
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
      const userId = context.user!.id;

      // Check if tournament exists and is active
      const tournaments = await query<Tournament>(
        "SELECT * FROM tournament WHERE id = $1",
        [input.tournamentId],
      );

      if (tournaments.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Tournament not found",
        });
      }

      const tournament = tournaments[0];

      if (tournament.tournament_state !== "active") {
        throw new ORPCError("BAD_REQUEST", {
          message: "Tournament is not accepting participants",
        });
      }

      // Check if already joined
      const existing = await query(
        "SELECT * FROM tournament_participations WHERE tournament_id = $1 AND user_id = $2",
        [input.tournamentId, userId],
      );

      if (existing.length > 0) {
        throw new ORPCError("CONFLICT", {
          message: "Already joined this tournament",
        });
      }

      // Check max participants
      if (tournament.max_participants) {
        const participantsCount = await query<{ count: string }>(
          "SELECT COUNT(*) as count FROM tournament_participations WHERE tournament_id = $1",
          [input.tournamentId],
        );

        if (
          parseInt(participantsCount[0].count) >= tournament.max_participants
        ) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Tournament is full",
          });
        }
      }

      // Join tournament
      const result = await query(
        `INSERT INTO tournament_participations (tournament_id, user_id, status, participation_state)
         VALUES ($1, $2, true, 'confirmed')
         RETURNING *`,
        [input.tournamentId, userId],
      );

      return result[0];
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
      const participants = await query(
        `SELECT u.id, u.name, u.short_name, u.url_image, tp.registration_date, tp.status, tp.participation_state
         FROM tournament_participations tp
         INNER JOIN users u ON tp.user_id = u.id
         WHERE tp.tournament_id = $1
         ORDER BY tp.registration_date ASC`,
        [input.tournamentId],
      );

      return participants;
    }),
});

export default tournamentsRouter;
