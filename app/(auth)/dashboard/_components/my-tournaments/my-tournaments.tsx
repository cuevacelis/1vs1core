"use client";

import { Trophy } from "lucide-react";
import Link from "next/link";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MyTournamentsEmpty } from "./empity-state/my-tournaments-empty";
import { MyTournamentsLoading } from "./loading/my-tournaments-loading";
import { useUserTournamentsQuery } from "./services/use-user-tournaments.query";

export function MyTournaments() {
  const tournamentsQuery = useUserTournamentsQuery({
    limit: 10,
    offset: 0,
  });

  const tournaments = tournamentsQuery.data ?? [];

  return (
    <QueryStatusHandler
      queries={[tournamentsQuery]}
      customLoadingComponent={<MyTournamentsLoading />}
      emptyStateComponent={<MyTournamentsEmpty />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Mis Torneos
          </CardTitle>
          <CardDescription>
            Torneos en los que estás participando
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Trophy className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Sin torneos activos
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Únete a un torneo para comenzar a competir
              </p>
              <Button asChild>
                <Link href="/torneo">Explorar Torneos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="space-y-1">
                    <h4 className="font-semibold">{tournament.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {tournament.game_name}
                      </Badge>
                      <span>•</span>
                      <span>
                        {tournament.tournament_state === "active" && "Activo"}
                        {tournament.tournament_state === "in_progress" &&
                          "En Progreso"}
                        {tournament.tournament_state === "completed" &&
                          "Completado"}
                        {tournament.tournament_state === "draft" && "Borrador"}
                      </span>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/torneo/${tournament.id}`}>Ver Detalles</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
