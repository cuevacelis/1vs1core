"use client";

import { TrendingUp, Trophy, Zap } from "lucide-react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatsCardsLoading } from "./loading/stats-cards-loading";
import { useUserStatsQuery } from "./services/use-user-stats.query";

export function StatsCards() {
  const statsQuery = useUserStatsQuery();

  const stats = statsQuery.data;
  const tournamentsJoined = stats?.tournamentsJoined || 0;
  const totalMatches = stats?.totalMatches || 0;
  const winRate = stats?.winRate || 0;

  return (
    <QueryStatusHandler
      queries={[statsQuery]}
      customLoadingComponent={<StatsCardsLoading />}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Torneos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tournamentsJoined}</div>
            <p className="text-xs text-muted-foreground">Torneos unidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Partidas Jugadas
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMatches}</div>
            <p className="text-xs text-muted-foreground">Total de partidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Victoria
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate}%</div>
            <p className="text-xs text-muted-foreground">Rendimiento general</p>
          </CardContent>
        </Card>
      </div>
    </QueryStatusHandler>
  );
}
