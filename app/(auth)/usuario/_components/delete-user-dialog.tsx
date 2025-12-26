"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserDeleteMutation } from "./services/use-user-delete.mutation";

interface DeleteUserDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  user: {
    id: number;
    name: string;
  } | null;
}

export function DeleteUserDialog({
  open,
  setOpen,
  user,
}: DeleteUserDialogProps) {
  const deleteMutation = useUserDeleteMutation();

  const handleDelete = () => {
    if (!user) return;

    deleteMutation.mutate(
      { id: user.id },
      {
        onSuccess: () => {
          setOpen(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            ¿Eliminar usuario?
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            usuario <strong>{user?.name}</strong> y todos sus datos asociados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
