import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query, transaction } from "../../db/config";
import { type Match, MatchWithPlayers, User } from "../../db/types";
import { adminOrpc, authedOrpc, orpc } from "../server";

const matchesRouter = orpc.router({
  // Get matches for a tournament
  listByTournament: orpc
    .route({
      method: "GET",
      path: "/matches/tournament/{tournamentId}",
      summary: "List tournament matches",
      description: "Get all matches for a specific tournament",
      tags: ["matches", "tournament"],
    })
    .input(z.object({ tournamentId: z.number() }))
    .handler(async ({ input }) => {
      const matches = await query<
        Match & {
          player1_name: string;
          player2_name: string;
          winner_name?: string;
        }
      >(
        `SELECT m.*,
                p1.name as player1_name,
                p2.name as player2_name,
                w.name as winner_name
         FROM match m
         INNER JOIN users p1 ON m.player1_id = p1.id
         INNER JOIN users p2 ON m.player2_id = p2.id
         LEFT JOIN users w ON m.winner_id = w.id
         WHERE m.tournament_id = $1
         ORDER BY m.round ASC, m.id ASC`,
        [input.tournamentId],
      );

      return matches;
    }),

  // Get match by ID
  getById: orpc
    .route({
      method: "GET",
      path: "/matches/{id}",
      summary: "Get match details",
      description: "Get detailed information about a specific match",
      tags: ["matches"],
    })
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      const matches = await query<
        Match & {
          player1_name: string;
          player2_name: string;
          player1_url_image?: string;
          player2_url_image?: string;
        }
      >(
        `SELECT m.*,
                p1.name as player1_name,
                p1.url_image as player1_url_image,
                p2.name as player2_name,
                p2.url_image as player2_url_image
         FROM match m
         INNER JOIN users p1 ON m.player1_id = p1.id
         INNER JOIN users p2 ON m.player2_id = p2.id
         WHERE m.id = $1`,
        [input.id],
      );

      if (matches.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Match not found",
        });
      }

      return matches[0];
    }),

  // Admin: Create matches for a tournament (bracket generation)
  generateMatches: adminOrpc
    .route({
      method: "POST",
      path: "/matches/generate",
      summary: "Generate tournament bracket",
      description:
        "Generate matches for a tournament based on participants (admin only)",
      tags: ["matches", "tournament", "admin"],
    })
    .input(
      z.object({
        tournamentId: z.number(),
        round: z.number().default(1),
      }),
    )
    .handler(async ({ input }) => {
      return await transaction(async (client) => {
        // Get all confirmed participants
        const participants = await client.query(
          `SELECT user_id FROM tournament_participations
           WHERE tournament_id = $1 AND state = 'confirmed'
           ORDER BY RANDOM()`,
          [input.tournamentId],
        );

        const userIds = participants.rows.map((p: any) => p.user_id);

        if (userIds.length < 2) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Not enough participants to generate matches",
          });
        }

        // Create matches by pairing participants randomly
        const matches: Match[] = [];
        for (let i = 0; i < userIds.length - 1; i += 2) {
          if (userIds[i + 1]) {
            const result = await client.query(
              `INSERT INTO match (tournament_id, round, player1_id, player2_id, state)
               VALUES ($1, $2, $3, $4, 'pending')
               RETURNING *`,
              [input.tournamentId, input.round, userIds[i], userIds[i + 1]],
            );
            matches.push(result.rows[0]);
          }
        }

        return matches;
      });
    }),

  // Admin: Activate a match (generate access codes for players)
  activateMatch: adminOrpc
    .route({
      method: "POST",
      path: "/matches/{matchId}/activate",
      summary: "Activate match",
      description:
        "Activate a match to make it available for players (admin only)",
      tags: ["matches", "admin"],
    })
    .input(z.object({ matchId: z.number() }))
    .handler(async ({ input }) => {
      const result = await query<Match>(
        `UPDATE match SET state = 'active', match_date = CURRENT_TIMESTAMP
         WHERE id = $1 AND state = 'pending'
         RETURNING *`,
        [input.matchId],
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Match not found or already active",
        });
      }

      return result[0];
    }),

  // Player: Get active match for current user
  getMyActiveMatch: authedOrpc
    .route({
      method: "GET",
      path: "/matches/my-active",
      summary: "Get my active match",
      description: "Get the current user's active match",
      tags: ["matches", "player"],
    })
    .handler(async ({ context }) => {
      const userId = context.user!.id;

      const matches = await query<
        Match & {
          player1_name: string;
          player2_name: string;
          tournament_name: string;
        }
      >(
        `SELECT m.*,
                p1.name as player1_name,
                p2.name as player2_name,
                t.name as tournament_name
         FROM match m
         INNER JOIN users p1 ON m.player1_id = p1.id
         INNER JOIN users p2 ON m.player2_id = p2.id
         INNER JOIN tournament t ON m.tournament_id = t.id
         WHERE (m.player1_id = $1 OR m.player2_id = $1)
         AND m.state IN ('active', 'player1_connected', 'player2_connected', 'both_connected', 'in_selection')
         ORDER BY m.match_date DESC
         LIMIT 1`,
        [userId],
      );

      return matches.length > 0 ? matches[0] : null;
    }),

  // Player: Connect to match
  connectToMatch: authedOrpc
    .route({
      method: "POST",
      path: "/matches/{matchId}/connect",
      summary: "Connect to match",
      description: "Connect to a match as a player",
      tags: ["matches", "player"],
    })
    .input(z.object({ matchId: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.user!.id;

      const matches = await query<Match>("SELECT * FROM match WHERE id = $1", [
        input.matchId,
      ]);

      if (matches.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Match not found",
        });
      }

      const match = matches[0];

      if (match.player1_id !== userId && match.player2_id !== userId) {
        throw new ORPCError("FORBIDDEN", {
          message: "You are not part of this match",
        });
      }

      if (
        !["active", "player1_connected", "player2_connected"].includes(
          match.state,
        )
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Match is not available for connection",
        });
      }

      let newMatchState = match.state;
      if (match.state === "active") {
        newMatchState =
          match.player1_id === userId
            ? "player1_connected"
            : "player2_connected";
      } else if (
        (match.state === "player1_connected" &&
          match.player2_id === userId) ||
        (match.state === "player2_connected" &&
          match.player1_id === userId)
      ) {
        newMatchState = "both_connected";
      }

      const result = await query<Match>(
        "UPDATE match SET state = $1 WHERE id = $2 RETURNING *",
        [newMatchState, input.matchId],
      );

      return result[0];
    }),

  // Admin: Complete match
  completeMatch: adminOrpc
    .route({
      method: "POST",
      path: "/matches/{matchId}/complete",
      summary: "Complete match",
      description: "Mark a match as completed with a winner (admin only)",
      tags: ["matches", "admin"],
    })
    .input(
      z.object({
        matchId: z.number(),
        winnerId: z.number(),
      }),
    )
    .handler(async ({ input }) => {
      const result = await query<Match>(
        `UPDATE match SET state = 'completed', winner_id = $1
         WHERE id = $2
         RETURNING *`,
        [input.winnerId, input.matchId],
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Match not found",
        });
      }

      return result[0];
    }),
});

export default matchesRouter;
