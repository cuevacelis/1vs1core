import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import type { Champion, MatchChampion } from "../../db/types";
import { adminOrpc, authedOrpc, orpc } from "../server";

const championsRouter = orpc.router({
  // Get champions by game
  listByGame: orpc
    .route({
      method: "GET",
      path: "/champions/game/{gameId}",
      summary: "List champions by game",
      description: "Returns all active champions for a specific game",
      tags: ["champions"],
    })
    .input(z.object({ gameId: z.number() }))
    .handler(async ({ input }) => {
      const champions = await query<Champion>(
        `SELECT * FROM champion
         WHERE game_id = $1 AND status = true AND ban_status IS NULL
         ORDER BY name ASC`,
        [input.gameId],
      );

      return champions;
    }),

  // Admin: Create champion
  create: adminOrpc
    .route({
      method: "POST",
      path: "/champions",
      summary: "Create champion",
      description: "Create a new champion (admin only)",
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
    .handler(async ({ input }) => {
      const result = await query<Champion>(
        `INSERT INTO champion (name, game_id, description, url_image)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [input.name, input.game_id, input.description, input.url_image],
      );

      return result[0];
    }),

  // Player: Select champion for match
  selectChampion: authedOrpc
    .route({
      method: "POST",
      path: "/champions/select",
      summary: "Select champion",
      description: "Select a champion for a match (real-time preview)",
      tags: ["champions", "match"],
    })
    .input(
      z.object({
        matchId: z.number(),
        championId: z.number(),
        role: z.string().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.user!.id;

      // Verify player is part of the match
      const matches = await query(
        `SELECT * FROM match
         WHERE id = $1 AND (player1_id = $2 OR player2_id = $2)
         AND match_state IN ('both_connected', 'in_selection')`,
        [input.matchId, userId],
      );

      if (matches.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Match not found or not available for selection",
        });
      }

      // Check if already locked
      const existing = await query<MatchChampion>(
        "SELECT * FROM match_champions WHERE match_id = $1 AND player_id = $2",
        [input.matchId, userId],
      );

      if (existing.length > 0 && existing[0].is_locked) {
        throw new ORPCError("FORBIDDEN", {
          message: "Champion selection already locked",
        });
      }

      // Update match status to in_selection if needed
      await query(
        `UPDATE match SET match_state = 'in_selection'
         WHERE id = $1 AND match_state = 'both_connected'`,
        [input.matchId],
      );

      // Upsert champion selection
      const result = await query<MatchChampion>(
        `INSERT INTO match_champions (match_id, player_id, champion_id, role, is_locked)
         VALUES ($1, $2, $3, $4, false)
         ON CONFLICT (match_id, player_id)
         DO UPDATE SET champion_id = $3, role = $4, selection_date = CURRENT_TIMESTAMP
         RETURNING *`,
        [input.matchId, userId, input.championId, input.role],
      );

      return result[0];
    }),

  // Player: Lock champion selection
  lockSelection: authedOrpc
    .route({
      method: "POST",
      path: "/champions/lock",
      summary: "Lock champion selection",
      description: "Confirm and lock champion selection for a match",
      tags: ["champions", "match"],
    })
    .input(z.object({ matchId: z.number() }))
    .handler(async ({ input, context }) => {
      const userId = context.user!.id;

      const result = await query<MatchChampion>(
        `UPDATE match_champions
         SET is_locked = true, lock_date = CURRENT_TIMESTAMP
         WHERE match_id = $1 AND player_id = $2
         RETURNING *`,
        [input.matchId, userId],
      );

      if (result.length === 0) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No champion selected",
        });
      }

      // Check if both players locked
      const selections = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM match_champions
         WHERE match_id = $1 AND is_locked = true`,
        [input.matchId],
      );

      if (parseInt(selections[0].count) === 2) {
        // Update match status to locked
        await query(`UPDATE match SET match_state = 'locked' WHERE id = $1`, [
          input.matchId,
        ]);
      }

      return result[0];
    }),

  // Get champion selections for a match
  getMatchSelections: orpc
    .route({
      method: "GET",
      path: "/champions/match/{matchId}",
      summary: "Get match champion selections",
      description: "Get all champion selections for a specific match",
      tags: ["champions", "match"],
    })
    .input(z.object({ matchId: z.number() }))
    .handler(async ({ input }) => {
      const selections = await query<
        MatchChampion & {
          player_name: string;
          champion_name: string;
          champion_url_image?: string;
        }
      >(
        `SELECT mc.*,
                u.name as player_name,
                c.name as champion_name,
                c.url_image as champion_url_image
         FROM match_champions mc
         INNER JOIN users u ON mc.player_id = u.id
         INNER JOIN champion c ON mc.champion_id = c.id
         WHERE mc.match_id = $1`,
        [input.matchId],
      );

      return selections;
    }),
});

export default championsRouter;
