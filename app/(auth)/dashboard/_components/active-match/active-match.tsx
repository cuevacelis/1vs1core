"use client";

import { Clock, Swords, Target } from "lucide-react";
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
import { ActiveMatchEmpty } from "./empity-state/active-match-empty";
import { ActiveMatchLoading } from "./loading/active-match-loading";
import { useMatchActiveQuery } from "./services/use-match-active.query";
import { useUserMeQuery } from "./services/use-user-me.query";

export function ActiveMatch() {
  const activeMatchQuery = useMatchActiveQuery();
  const userQuery = useUserMeQuery();

  const activeMatch = activeMatchQuery.data;
  const user = userQuery.data;

  return (
    <QueryStatusHandler
      queries={[activeMatchQuery, userQuery]}
      customLoadingComponent={<ActiveMatchLoading />}
      emptyStateComponent={<ActiveMatchEmpty />}
    >
      <Card className="xl:col-span-2">
        <CardHeader className="flex flex-row items-center">
          <div className="grid gap-2">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Partida Activa
            </CardTitle>
            <CardDescription>Estado de tu partida actual</CardDescription>
          </div>
          {activeMatch && (
            <Badge className="ml-auto">
              <Clock className="mr-1 h-3 w-3" />
              En Progreso
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!activeMatch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Swords className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sin partida activa</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Serás notificado cuando una partida esté lista. Mientras tanto,
                puedes explorar torneos disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Torneo
                  </p>
                  <p className="text-lg font-semibold">
                    {activeMatch.tournament_name}
                  </p>
                </div>
                <Badge variant="outline">Ronda {activeMatch.round}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {activeMatch.player1_id === user?.id ? "Tú" : "Oponente"}
                  </p>
                  <p className="font-semibold">{activeMatch.player1_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {activeMatch.player2_id === user?.id ? "Tú" : "Oponente"}
                  </p>
                  <p className="font-semibold">{activeMatch.player2_name}</p>
                </div>
              </div>

              <div className="pt-4">
                <Button asChild className="w-full">
                  <Link href="/player">Ir a la Partida</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
