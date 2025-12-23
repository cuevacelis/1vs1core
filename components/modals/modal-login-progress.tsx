import { BadgeCheckIcon, ShieldAlertIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "../ui/badge";
import { Spinner } from "../ui/spinner";

interface ILoadingProgressModalProps {
  isPending: boolean;
  isAuthSuccess?: boolean;
}

/**
 * Modal component that displays login progress with animated UI elements
 * Shows a spinner, animated title, and rotating status messages during authentication
 */
export function LoadingProgressModal({
  isPending,
  isAuthSuccess,
}: ILoadingProgressModalProps) {
  return (
    <Dialog modal={true} open={isPending || isAuthSuccess}>
      <DialogContent
        className="sm:max-w-[425px] [&>button:last-child]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Login</DialogTitle>
          <DialogDescription>Cargando información...</DialogDescription>
        </DialogHeader>

        <section className="flex flex-col items-center justify-center space-y-4">
          {isAuthSuccess ? (
            <section className="space-y-3 flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-center">
                Redirigiendo
              </h3>
              <Badge
                variant="secondary"
                className="bg-green-500 text-white dark:bg-green-600"
              >
                <BadgeCheckIcon />
                Autenticación exitosa
              </Badge>
              <Spinner className="size-6" />
            </section>
          ) : (
            <section className="space-y-3 flex flex-col items-center justify-center">
              <h3 className="text-xl font-semibold text-center">
                Autenticando
              </h3>
              <Badge variant="secondary">
                <ShieldAlertIcon />
                Validando credenciales
              </Badge>
              <Spinner className="size-6" />
            </section>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
