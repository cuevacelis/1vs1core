import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { query } from "../../db/config";
import { adminOrpc, orpc } from "../server";

const gamesRouter = orpc.router({
  // List all games
  list: orpc
    .route({
      method: "GET",
      path: "/games",
      summary: "List games",
      description: "Get all active games",
      tags: ["games"],
    })
    .handler(async () => {
      // Use database function fn_game_list
      const result = await query<{ out_game: object }>(
        `SELECT * FROM fn_game_list()`
      );

      return result.map((row) => row.out_game);
    }),

  // Get game by ID
  getById: orpc
    .route({
      method: "GET",
      path: "/games/{id}",
      summary: "Get game details",
      description: "Get detailed information about a specific game",
      tags: ["games"],
    })
    .input(z.object({ id: z.number() }))
    .handler(async ({ input }) => {
      // Use database function fn_game_get_by_id
      const result = await query<{ out_game: object }>(
        `SELECT * FROM fn_game_get_by_id($1)`,
        [input.id]
      );

      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Game not found",
        });
      }

      return result[0].out_game;
    }),

  // Admin: Create game
  create: adminOrpc
    .route({
      method: "POST",
      path: "/games",
      summary: "Create game",
      description: "Create a new game (admin only)",
      tags: ["games", "admin"],
    })
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.string().min(1).max(50),
        description: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      // Use database function fn_game_create
      const result = await query<{ out_game: object }>(
        `SELECT * FROM fn_game_create($1, $2, $3)`,
        [input.name, input.type, input.description || null]
      );

      if (result.length === 0) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create game",
        });
      }

      return result[0].out_game;
    }),
});

export default gamesRouter;
