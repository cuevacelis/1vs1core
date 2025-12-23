import { LogOutIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Spinner } from "../ui/spinner";

interface ILogoutProgressModalProps {
  isPending: boolean;
}

export function LogoutProgressModal({ isPending }: ILogoutProgressModalProps) {
  return (
    <Dialog modal={true} open={isPending}>
      <DialogContent
        className="sm:max-w-[425px] [&>button:last-child]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Cierre de Sesión</DialogTitle>
          <DialogDescription>Cerrando sesión...</DialogDescription>
        </DialogHeader>
        <section className="space-y-3 flex flex-col items-center justify-center">
          <h3 className="text-xl font-semibold text-center">Cerrando sesión</h3>
          <Badge variant="secondary">
            <LogOutIcon />
            Por favor, espere.
          </Badge>
          <Spinner className="size-6" />
        </section>
      </DialogContent>
    </Dialog>
  );
}
