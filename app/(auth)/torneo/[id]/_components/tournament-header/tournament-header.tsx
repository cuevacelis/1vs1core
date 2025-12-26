"use client";

import Image from "next/image";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Card, CardContent } from "@/components/ui/card";
import { TournamentHeaderEmpty } from "./empity-state/tournament-header-empty";
import { TournamentHeaderLoading } from "./loading/tournament-header-loading";
import { useTournamentDetailQuery } from "../services/use-tournament-detail.query";

interface TournamentHeaderProps {
  tournamentId: number;
}

export function TournamentHeader({ tournamentId }: TournamentHeaderProps) {
  const tournamentQuery = useTournamentDetailQuery(tournamentId);
  const tournament = tournamentQuery.data;

  return (
    <QueryStatusHandler
      queries={[tournamentQuery]}
      customLoadingComponent={<TournamentHeaderLoading />}
      emptyStateComponent={<TournamentHeaderEmpty />}
    >
      <Card>
        <CardContent className="p-0">
          <div className="aspect-video relative bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-t-lg overflow-hidden">
            {tournament?.url_image ? (
              <Image
                src={tournament.url_image}
                alt={tournament.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <div className="text-6xl font-bold text-primary/20">
                    {tournament?.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Banner del torneo
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {tournament?.name}
              </h1>
            </div>

            {tournament?.description && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-muted-foreground">{tournament.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
