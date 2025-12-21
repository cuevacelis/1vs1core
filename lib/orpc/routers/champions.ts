import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
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
      // Use database function fn_champion_list_by_game
      const result = await query<{ out_champion: object }>(
        `SELECT * FROM fn_champion_list_by_game($1)`,
        [input.gameId]
      );

      return result.map((row) => row.out_champion);
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
      })
    )
    .handler(async ({ input }) => {
      // Use database function fn_champion_create
      const result = await query<{ out_champion: object }>(
        `SELECT * FROM fn_champion_create($1, $2, $3, $4)`,
        [
          input.name,
          input.game_id,
          input.description || null,
          input.url_image || null,
        ]
      );

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create champion",
        });
      }

      return result[0].out_champion;
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
      })
    )
    .handler(async ({ input, context }) => {
      const userId = context.user?.id;

      // Use database function fn_champion_select
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_selection: object | null;
      }>(`SELECT * FROM fn_champion_select($1, $2, $3, $4)`, [
        input.matchId,
        userId,
        input.championId,
        input.role || null,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        const message = result[0]?.out_message || "Failed to select champion";

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

      return result[0].out_selection;
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
      const userId = context.user?.id;

      // Use database function fn_champion_lock_selection
      const result = await query<{
        out_success: boolean;
        out_message: string;
        out_selection: object | null;
      }>(`SELECT * FROM fn_champion_lock_selection($1, $2)`, [
        input.matchId,
        userId,
      ]);

      if (result.length === 0 || !result[0].out_success) {
        throw new ORPCError("BAD_REQUEST", {
          message: result[0]?.out_message || "No champion selected",
        });
      }

      return result[0].out_selection;
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
      // Use database function fn_champion_get_match_selections
      const result = await query<{ out_selection: object }>(
        `SELECT * FROM fn_champion_get_match_selections($1)`,
        [input.matchId]
      );

      return result.map((row) => row.out_selection);
    }),
});

export default championsRouter;
