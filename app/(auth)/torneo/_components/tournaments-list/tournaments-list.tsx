"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Users } from "lucide-react";
import Link from "next/link";
import { useTournamentsListQuery } from "@/app/(auth)/torneo/_components/services/use-tournaments-list.query";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentsListEmpty } from "./empity-state/tournaments-list-empty";
import { TournamentsListLoading } from "./loading/tournaments-list-loading";

interface TournamentsListProps {
  activeTab: "all" | "active" | "upcoming" | "completed";
}

export function TournamentsList({ activeTab }: TournamentsListProps) {
  // Declare hooks internally (self-contained component pattern)
  const tournamentsQuery = useTournamentsListQuery(
    activeTab === "all"
      ? {}
      : activeTab === "active"
        ? { tournament_state: "active" }
        : activeTab === "upcoming"
          ? { tournament_state: "draft" }
          : { tournament_state: "completed" },
  );

  // Extract data
  const tournaments = tournamentsQuery.data;

  // Helper function to get tournament state label
  const getTournamentStateLabel = (state: string) => {
    const labels: Record<
      string,
      {
        text: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      draft: { text: "Borrador", variant: "secondary" },
      active: { text: "Activo", variant: "default" },
      in_progress: { text: "En Progreso", variant: "outline" },
      completed: { text: "Completado", variant: "outline" },
      cancelled: { text: "Cancelado", variant: "destructive" },
    };
    return labels[state] || { text: state, variant: "outline" };
  };

  return (
    <QueryStatusHandler
      queries={[tournamentsQuery]}
      customLoadingComponent={<TournamentsListLoading />}
      emptyStateComponent={<TournamentsListEmpty activeTab={activeTab} />}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments?.map((tournament) => {
          const stateLabel = getTournamentStateLabel(tournament.state);
          return (
            <Link key={tournament.id} href={`/torneo/${tournament.id}`}>
              <Card className="border-2 hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tournament.game_name} ({tournament.game_type})
                        </p>
                      </div>
                      <Badge variant={stateLabel.variant}>
                        {stateLabel.text}
                      </Badge>
                    </div>

                    {/* Description */}
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tournament.description}
                      </p>
                    )}

                    {/* Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {tournament.max_participants && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Máx. {tournament.max_participants}</span>
                        </div>
                      )}
                      {tournament.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDistanceToNow(
                              new Date(tournament.start_date),
                              {
                                addSuffix: true,
                                locale: es,
                              },
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </QueryStatusHandler>
  );
}
