"use client";

import { Swords, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Match {
  id: number;
  player1_id: number | null;
  player2_id: number | null;
  player1_name?: string;
  player2_name?: string;
  status: string;
  scheduled_time: string | null;
  winner_id: number | null;
}

interface MatchesListProps {
  matches: Match[];
  tournamentId: number;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "secondary" },
  active: { label: "Activo", variant: "default" },
  player1_connected: { label: "Jugador 1 conectado", variant: "outline" },
  player2_connected: { label: "Jugador 2 conectado", variant: "outline" },
  both_connected: { label: "Ambos conectados", variant: "default" },
  in_selection: { label: "En selección", variant: "default" },
  locked: { label: "Bloqueado", variant: "outline" },
  completed: { label: "Completado", variant: "secondary" },
};

export function MatchesList({ matches, tournamentId }: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-5 w-5" />
            Partidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Swords className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              No hay partidas programadas
            </p>
            <p className="text-xs text-muted-foreground">
              Las partidas aparecerán aquí cuando el torneo comience
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="h-5 w-5" />
          Partidas ({matches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {matches.map((match) => {
            const statusConfig = STATUS_LABELS[match.status] || {
              label: match.status,
              variant: "outline" as const,
            };

            return (
              <div
                key={match.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Players */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {match.player1_name || "Por asignar"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-px bg-border" />
                        <Swords className="h-4 w-4 text-muted-foreground" />
                        <div className="w-8 h-px bg-border" />
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-sm font-medium">
                          {match.player2_name || "Por asignar"}
                        </p>
                      </div>
                    </div>

                    {/* Match info */}
                    <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {match.scheduled_time
                              ? new Date(match.scheduled_time).toLocaleDateString(
                                  "es-ES",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : "Sin programar"}
                          </span>
                        </div>
                        {match.winner_id && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Trophy className="h-3 w-3" />
                            <span>
                              Ganador:{" "}
                              {match.winner_id === match.player1_id
                                ? match.player1_name
                                : match.player2_name}
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge variant={statusConfig.variant} className="text-xs">
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {match.status === "active" && (
                  <div className="mt-3 pt-3 border-t">
                    <Link href={`/player?matchId=${match.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        Ver partida
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
