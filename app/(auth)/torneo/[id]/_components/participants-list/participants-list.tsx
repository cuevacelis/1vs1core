"use client";

import { Users } from "lucide-react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ParticipantsListEmpty } from "./empity-state/participants-list-empty";
import { ParticipantsListLoading } from "./loading/participants-list-loading";
import { useTournamentParticipantsQuery } from "../services/use-tournament-participants.query";

interface ParticipantsListProps {
  tournamentId: number;
  currentUserId?: number;
}

type ParticipantState = "registered" | "confirmed" | "withdrawn";

const STATE_LABELS: Record<
  ParticipantState,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  registered: { label: "Registrado", variant: "secondary" },
  confirmed: { label: "Confirmado", variant: "default" },
  withdrawn: { label: "Retirado", variant: "outline" },
};

export function ParticipantsList({
  tournamentId,
  currentUserId,
}: ParticipantsListProps) {
  const participantsQuery = useTournamentParticipantsQuery(tournamentId);
  const participants = participantsQuery.data || [];

  return (
    <QueryStatusHandler
      queries={[participantsQuery]}
      customLoadingComponent={<ParticipantsListLoading />}
      emptyStateComponent={<ParticipantsListEmpty />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participantes ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto pr-2">
            <div className="space-y-3">
              {participants.map((participant, index) => {
                const stateConfig = STATE_LABELS[participant.state];
                const isCurrentUser = participant.user_id === currentUserId;

                return (
                  <div
                    key={participant.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isCurrentUser
                        ? "bg-primary/5 border-primary/20"
                        : "bg-card hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.user_name}`}
                              alt={participant.user_name}
                            />
                            <AvatarFallback>
                              {participant.user_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-background rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary text-[8px] font-bold text-primary-foreground rounded-full flex items-center justify-center">
                              {index + 1}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {participant.user_name}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Tú
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Registrado:{" "}
                          {new Date(
                            participant.registration_date,
                          ).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={stateConfig.variant}
                      className="text-xs shrink-0"
                    >
                      {stateConfig.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
