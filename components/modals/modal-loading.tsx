import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalLoadingProps {
  open?: boolean;
  message?: React.ReactNode;
  messageSecondary?: React.ReactNode;
}

export function ModalLoading({
  open = true,
  message = "🌐 Conectando con el servidor...",
  messageSecondary = "Por favor, espere mientras cargamos la información",
}: ModalLoadingProps) {
  return (
    <Dialog open={open}>
      <DialogContent
        // onOpenAutoFocus={(e) => e.preventDefault()}
        // onCloseAutoFocus={(e) => e.preventDefault()}
        className="sm:max-w-[425px] bg-linear-to-br from-primary/5 via-background to-secondary/5 border-none shadow-lg [&>button:last-child]:hidden"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Modal Loading</DialogTitle>
          <DialogDescription>Cargando información...</DialogDescription>
        </DialogHeader>

        <section className="flex flex-col items-center justify-center">
          {/* Mensaje con puntos animados */}
          <div className="flex items-center justify-center">
            <span className="text-lg font-medium">{message}</span>
          </div>

          <p className="text-sm text-muted-foreground">{messageSecondary}</p>
        </section>
      </DialogContent>
    </Dialog>
  );
}
