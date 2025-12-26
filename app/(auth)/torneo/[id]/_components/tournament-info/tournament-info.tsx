"use client";

import { Calendar, Pencil, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTournamentDetailQuery } from "../services/use-tournament-detail.query";
import { useTournamentParticipantsQuery } from "../services/use-tournament-participants.query";
import { TournamentInfoEmpty } from "./empity-state/tournament-info-empty";
import { TournamentInfoLoading } from "./loading/tournament-info-loading";
import { useUserMeQuery } from "./services/use-user-me.query";

interface TournamentInfoProps {
  tournamentId: number;
  currentUserId?: number;
  onJoinTournament?: () => void;
}

const stateTranslations = {
  draft: "Borrador",
  active: "Activo",
  in_progress: "En progreso",
  completed: "Finalizado",
  cancelled: "Cancelado",
} as const;

export function TournamentInfo({
  tournamentId,
  currentUserId,
  onJoinTournament,
}: TournamentInfoProps) {
  const tournamentQuery = useTournamentDetailQuery(tournamentId);
  const participantsQuery = useTournamentParticipantsQuery(tournamentId);
  const userMeQuery = useUserMeQuery();

  const tournament = tournamentQuery.data;
  const participants = participantsQuery.data || [];
  const user = userMeQuery.data;

  const isUserParticipating = participants.some(
    (p) => p.user_id === currentUserId && p.state !== "withdrawn",
  );

  // Check if user is admin
  const isAdmin = user?.role.name === "admin";

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Por definir";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const participantsText = tournament?.max_participants
    ? `${participants.length} / ${tournament.max_participants}`
    : `${participants.length}`;

  const isFull = tournament?.max_participants
    ? participants.length >= tournament.max_participants
    : false;

  return (
    <QueryStatusHandler
      queries={[tournamentQuery, participantsQuery, userMeQuery]}
      customLoadingComponent={<TournamentInfoLoading />}
      emptyStateComponent={<TournamentInfoEmpty />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Información del Torneo
            </div>
            {isAdmin && (
              <Link href={`/torneo/${tournamentId}/editar`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              </Link>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-0.5">
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Estado
                  </p>
                  <Badge variant="default">
                    {stateTranslations[tournament?.state ?? "draft"]}
                  </Badge>
                </div>
              </div>
            </div>
            <Separator />
            <InfoItem
              icon={Trophy}
              label="Juego"
              value="League of Legends"
              subtitle="MOBA"
            />
            <Separator />
            <InfoItem
              icon={Users}
              label="Participantes"
              value={participantsText}
              highlight={isFull ? "destructive" : undefined}
            />
            <Separator />
            <InfoItem
              icon={Calendar}
              label="Fecha de inicio"
              value={formatDate(tournament?.start_date ?? null)}
            />
            {tournament?.end_date && (
              <>
                <Separator />
                <InfoItem
                  icon={Calendar}
                  label="Fecha de fin"
                  value={formatDate(tournament.end_date)}
                />
              </>
            )}
          </div>

          {onJoinTournament && tournament?.state === "active" && (
            <div className="pt-2">
              <Button
                onClick={onJoinTournament}
                disabled={isFull || isUserParticipating}
                className="w-full"
                size="lg"
              >
                {isUserParticipating
                  ? "Ya estás participando"
                  : isFull
                    ? "Torneo lleno"
                    : "Unirse al torneo"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}

interface InfoItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  highlight?: "destructive" | "success";
}

function InfoItem({
  icon: Icon,
  label,
  value,
  subtitle,
  highlight,
}: InfoItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p
          className={`text-sm font-semibold ${
            highlight === "destructive"
              ? "text-destructive"
              : highlight === "success"
                ? "text-green-600"
                : ""
          }`}
        >
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
