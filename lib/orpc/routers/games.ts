import { z } from "zod";
import { query } from "../../db/config";
import type { Game } from "../../db/types";
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
      const games = await query<Game>(
        `SELECT * FROM game WHERE status = true ORDER BY name ASC`,
      );

      return games;
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
      const games = await query<Game>("SELECT * FROM game WHERE id = $1", [
        input.id,
      ]);

      if (games.length === 0) {
        throw new Error("Game not found");
      }

      return games[0];
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
      }),
    )
    .handler(async ({ input }) => {
      const result = await query<Game>(
        `INSERT INTO game (name, type, description)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [input.name, input.type, input.description],
      );

      return result[0];
    }),
});

export default gamesRouter;
