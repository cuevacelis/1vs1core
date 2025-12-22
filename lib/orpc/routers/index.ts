import { authRouter } from "./auth";
import { championsRouter } from "./champions";
import { gamesRouter } from "./games";
import { matchesRouter } from "./matches";
import { tournamentsRouter } from "./tournaments";
import { usersRouter } from "./users";

export const routerORPC = {
  auth: authRouter,
  users: usersRouter,
  tournaments: tournamentsRouter,
  matches: matchesRouter,
  champions: championsRouter,
  games: gamesRouter,
};

export type RouterORPC = typeof routerORPC;
