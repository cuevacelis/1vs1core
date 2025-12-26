"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTournamentDeleteMutation } from "../services/use-tournament-delete.mutation";

interface DeleteTournamentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  tournamentName: string;
}

export function DeleteTournamentDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
}: DeleteTournamentDialogProps) {
  const router = useRouter();
  const deleteMutation = useTournamentDeleteMutation();

  const handleDelete = () => {
    deleteMutation.mutate(
      { id: tournamentId },
      {
        onSuccess: () => {
          onOpenChange(false);
          router.push("/torneo");
          router.refresh();
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle>¿Eliminar torneo?</AlertDialogTitle>
          </div>
          <MutationStatusHandler mutations={[deleteMutation]}>
            <AlertDialogDescription className="pt-4">
              Estás a punto de eliminar el torneo{" "}
              <span className="font-semibold text-foreground">
                &quot;{tournamentName}&quot;
              </span>
              . Esta acción no se puede deshacer y se eliminarán todos los datos
              relacionados:
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>Todos los participantes registrados</li>
                <li>Todas las partidas asociadas</li>
                <li>Toda la información del torneo</li>
              </ul>
            </AlertDialogDescription>
          </MutationStatusHandler>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar torneo"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
