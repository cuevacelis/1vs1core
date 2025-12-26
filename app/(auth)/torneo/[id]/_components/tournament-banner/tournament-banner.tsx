"use client";

import { Trophy } from "lucide-react";
import Image from "next/image";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useTournamentDetailQuery } from "../services/use-tournament-detail.query";
import { TournamentBannerEmpty } from "./empity-state/tournament-banner-empty";
import { TournamentBannerLoading } from "./loading/tournament-banner-loading";

interface TournamentBannerProps {
  tournamentId: number;
}

const STATE_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  draft: { label: "Borrador", variant: "secondary" },
  active: { label: "Activo", variant: "default" },
  in_progress: { label: "En progreso", variant: "outline" },
  completed: { label: "Completado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

export function TournamentBanner({ tournamentId }: TournamentBannerProps) {
  const tournamentQuery = useTournamentDetailQuery(tournamentId);
  const tournament = tournamentQuery.data;

  const stateConfig = STATE_LABELS[tournament?.state ?? "draft"] || {
    label: tournament?.state ?? "draft",
    variant: "outline" as const,
  };

  return (
    <QueryStatusHandler
      queries={[tournamentQuery]}
      customLoadingComponent={<TournamentBannerLoading />}
      emptyStateComponent={<TournamentBannerEmpty />}
    >
      <Card>
        <CardContent className="p-0">
          <div className="aspect-video bg-gradient-to-br from-primary/10 via-primary/5 to-background rounded-t-lg relative overflow-hidden">
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
                <Trophy className="h-24 w-24 text-muted-foreground/20" />
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {tournament?.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  League of Legends
                </p>
              </div>
              <Badge variant={stateConfig.variant} className="shrink-0">
                {stateConfig.label}
              </Badge>
            </div>

            {tournament?.description && (
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <p>{tournament.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
