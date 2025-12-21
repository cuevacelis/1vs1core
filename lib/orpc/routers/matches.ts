import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
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
      // Use database function fn_match_list_by_tournament
      const result = await query<{ out_match: object }>(
        `SELECT * FROM fn_match_list_by_tournament($1)`,
        [input.tournamentId]
      );

      return result.map((row) => row.out_match);
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
      // Use database function fn_match_get_by_id
      const result = await query<{ out_match: object }>(
        `SELECT * FROM fn_match_get_by_id($1)`,
        [input.id]
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Match not found",
        });
      }

      return result[0].out_match;
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
      })
    )
    .handler(async ({ input }) => {
      // Use database function fn_match_generate_for_tournament
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_matches: object;
      }>(`SELECT * FROM fn_match_generate_for_tournament($1, $2)`, [
        input.tournamentId,
        input.round,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("BAD_REQUEST", {
          message: result[0]?.out_message || "Failed to generate matches",
        });
      }

      return result[0].out_matches;
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
      // Use database function fn_match_activate
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_match: object | null;
      }>(`SELECT * FROM fn_match_activate($1)`, [input.matchId]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("NOT_FOUND", {
          message:
            result[0]?.out_message || "Match not found or already active",
        });
      }

      return result[0].out_match;
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
      const userId = context.user?.id;

      // Use database function fn_match_get_active_for_user
      const result = await query<{ out_match: object }>(
        `SELECT * FROM fn_match_get_active_for_user($1)`,
        [userId]
      );

      return result.length > 0 ? result[0].out_match : null;
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
      const userId = context.user?.id;

      // Use database function fn_match_connect
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_match: object | null;
      }>(`SELECT * FROM fn_match_connect($1, $2)`, [input.matchId, userId]);

      if (result.length === 0 || !result[0].out_success) {
        const message = result[0]?.out_message || "Failed to connect to match";

        if (message.includes("No eres parte")) {
          throw new ORPCError("FORBIDDEN", { message });
        } else if (message.includes("no encontrada")) {
          throw new ORPCError("NOT_FOUND", { message });
        } else {
          throw new ORPCError("BAD_REQUEST", { message });
        }
      }

      return result[0].out_match;
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
      })
    )
    .handler(async ({ input }) => {
      // Use database function fn_match_complete
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_match: object | null;
      }>(`SELECT * FROM fn_match_complete($1, $2)`, [
        input.matchId,
        input.winnerId,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("NOT_FOUND", {
          message: result[0]?.out_message || "Match not found",
        });
      }

      return result[0].out_match;
    }),
});

export default matchesRouter;
