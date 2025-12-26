"use client";

import { Award, Zap } from "lucide-react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecentMatchesEmpty } from "./empity-state/recent-matches-empty";
import { RecentMatchesLoading } from "./loading/recent-matches-loading";
import { useUserRecentMatchesQuery } from "./services/use-user-recent-matches.query";

export function RecentMatches() {
  const recentMatchesQuery = useUserRecentMatchesQuery({
    limit: 10,
    offset: 0,
  });

  const recentMatches = recentMatchesQuery.data ?? [];

  return (
    <QueryStatusHandler
      queries={[recentMatchesQuery]}
      customLoadingComponent={<RecentMatchesLoading />}
      emptyStateComponent={<RecentMatchesEmpty />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Historial de Partidas
          </CardTitle>
          <CardDescription>
            Tu historial de partidas y rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Sin partidas recientes
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Tu historial de partidas aparecerá aquí una vez que comiences a
                jugar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Torneo</TableHead>
                  <TableHead>Oponente</TableHead>
                  <TableHead>Campeón</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead className="text-right">Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">
                      {match.tournament_name}
                    </TableCell>
                    <TableCell>{match.opponent_name}</TableCell>
                    <TableCell>{match.my_champion || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          match.result === "Victoria" ? "default" : "secondary"
                        }
                      >
                        {match.result}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {match.match_date
                        ? new Date(match.match_date).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
