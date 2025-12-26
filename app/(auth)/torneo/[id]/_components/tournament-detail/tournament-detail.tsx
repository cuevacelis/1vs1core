"use client";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Button } from "@/components/ui/button";
import { DeleteTournamentDialog } from "../delete-tournament-dialog/delete-tournament-dialog";
import { MatchesList } from "../matches-list/matches-list";
import { ParticipantsList } from "../participants-list/participants-list";
import { useJoinTournamentMutation } from "../services/use-join-tournament.mutation";
import { useTournamentDetailQuery } from "../services/use-tournament-detail.query";
import { TournamentBanner } from "../tournament-banner/tournament-banner";
import { useUserMeQuery } from "../tournament-info/services/use-user-me.query";
import { TournamentInfo } from "../tournament-info/tournament-info";

interface TournamentDetailProps {
  tournamentId: number;
  currentUserId?: number;
}

export function TournamentDetail({
  tournamentId,
  currentUserId,
}: TournamentDetailProps) {
  const joinMutation = useJoinTournamentMutation();
  const userMeQuery = useUserMeQuery();
  const tournamentQuery = useTournamentDetailQuery(tournamentId);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const user = userMeQuery.data;
  const tournament = tournamentQuery.data;
  const isAdmin = user?.role?.name === "admin";

  // Mock matches data (to be replaced with real API when endpoint exists)
  const matches: never[] = [];

  const handleJoinTournament = () => {
    joinMutation.mutate({ tournamentId });
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mutation status handler */}
        <MutationStatusHandler mutations={[joinMutation]}>
          {/* Delete confirmation dialog */}
          {tournament && (
            <DeleteTournamentDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
              tournamentId={tournamentId}
              tournamentName={tournament.name}
            />
          )}

          {/* Header with back button and admin actions */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link href="/torneo">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a torneos
              </Button>
            </Link>

            {/* Admin actions */}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Link href={`/torneo/${tournamentId}/editar`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tournament banner */}
              <TournamentBanner tournamentId={tournamentId} />

              {/* Matches list */}
              <MatchesList matches={matches} tournamentId={tournamentId} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tournament info */}
              <TournamentInfo
                tournamentId={tournamentId}
                currentUserId={currentUserId}
                onJoinTournament={handleJoinTournament}
              />

              {/* Participants list */}
              <ParticipantsList
                tournamentId={tournamentId}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </MutationStatusHandler>
      </div>
    </div>
  );
}
