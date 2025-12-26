"use client";

import { Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAdminAddParticipantMutation } from "../services/use-admin-add-participant.mutation";
import { useAvailableUsersQuery } from "../services/use-available-users.query";

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  existingParticipantIds: number[];
}

export function AddParticipantDialog({
  open,
  onOpenChange,
  tournamentId,
  existingParticipantIds,
}: AddParticipantDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const usersQuery = useAvailableUsersQuery({
    enabled: open,
  });
  const addParticipantMutation = useAdminAddParticipantMutation();

  // Filter users: exclude existing participants and filter by search
  const availableUsers = useMemo(() => {
    if (!usersQuery.data) return [];

    return usersQuery.data
      .filter((user) => !existingParticipantIds.includes(user.id))
      .filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [usersQuery.data, existingParticipantIds, searchQuery]);

  const handleAddParticipant = (userId: number) => {
    addParticipantMutation.mutate(
      {
        tournamentId,
        userId,
      },
      {
        onSuccess: () => {
          // Close dialog after successful addition
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Agregar Participante</DialogTitle>
          <DialogDescription>
            Selecciona un usuario para agregarlo al torneo
          </DialogDescription>
        </DialogHeader>

        <MutationStatusHandler mutations={[addParticipantMutation]}>
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users list */}
            <QueryStatusHandler queries={[usersQuery]}>
              <div className="max-h-[400px] overflow-y-auto pr-2">
                {availableUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    {searchQuery
                      ? "No se encontraron usuarios con ese nombre"
                      : "Todos los usuarios ya están en el torneo"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={
                              user.url_image ||
                              `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                            }
                            alt={user.name}
                          />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.name}
                          </p>
                          {user.short_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              {user.short_name}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddParticipant(user.id)}
                          disabled={addParticipantMutation.isPending}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Agregar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </QueryStatusHandler>
          </div>
        </MutationStatusHandler>
      </DialogContent>
    </Dialog>
  );
}
