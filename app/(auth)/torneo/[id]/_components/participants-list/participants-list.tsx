"use client";

import { Edit, Trash2, UserPlus, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminRemoveParticipantMutation } from "../services/use-admin-remove-participant.mutation";
import { useTournamentParticipantsQuery } from "../services/use-tournament-participants.query";
import { useUserMeQuery } from "../services/use-user-me.query";
import { AddParticipantDialog } from "./add-participant-dialog";
import { ParticipantsListEmpty } from "./empity-state/participants-list-empty";
import { ParticipantsListLoading } from "./loading/participants-list-loading";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const participantsQuery = useTournamentParticipantsQuery(tournamentId);
  const userMeQuery = useUserMeQuery();
  const removeParticipantMutation = useAdminRemoveParticipantMutation();

  const participants = participantsQuery.data || [];
  const user = userMeQuery.data;
  const isAdmin = useMemo(
    () => user?.role?.name === "admin",
    [user?.role?.name],
  );

  const handleRemoveParticipant = (userId: number) => {
    removeParticipantMutation.mutate({
      tournamentId,
      userId,
    });
  };

  const existingParticipantIds = useMemo(
    () => participants.map((p) => p.user_id),
    [participants],
  );

  return (
    <MutationStatusHandler mutations={[removeParticipantMutation]}>
      <AddParticipantDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        tournamentId={tournamentId}
        existingParticipantIds={existingParticipantIds}
      />

      <QueryStatusHandler
        queries={[participantsQuery]}
        customLoadingComponent={<ParticipantsListLoading />}
        emptyStateComponent={<ParticipantsListEmpty />}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes ({participants.length})
              </CardTitle>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  {isEditMode ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAddDialogOpen(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditMode(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditMode(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              )}
            </div>
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

                      {isEditMode && isAdmin ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleRemoveParticipant(participant.user_id)
                          }
                          disabled={removeParticipantMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Badge
                          variant={stateConfig.variant}
                          className="text-xs shrink-0"
                        >
                          {stateConfig.label}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </QueryStatusHandler>
    </MutationStatusHandler>
  );
}
