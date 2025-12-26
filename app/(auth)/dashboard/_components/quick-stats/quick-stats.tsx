"use client";

import { Users } from "lucide-react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickStatsLoading } from "./loading/quick-stats-loading";
import { useUserStatsQuery } from "./services/use-user-stats.query";

export function QuickStats() {
  const statsQuery = useUserStatsQuery();

  const stats = statsQuery.data;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const currentStreak = stats?.currentStreak || 0;

  return (
    <QueryStatusHandler
      queries={[statsQuery]}
      customLoadingComponent={<QuickStatsLoading />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estadísticas Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Victorias</span>
            <span className="text-2xl font-bold">{wins}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Derrotas</span>
            <span className="text-2xl font-bold">{losses}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Racha</span>
            <Badge variant={currentStreak > 0 ? "default" : "outline"}>
              {currentStreak} {currentStreak === 1 ? "victoria" : "victorias"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
