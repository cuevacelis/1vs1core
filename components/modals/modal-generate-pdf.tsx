import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ModalGeneratePdfProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  download?: {
    isDownload: boolean;
    isProcessing: boolean;
  };
}

export function ModalGeneratePdf({
  open,
  setOpen,
  download,
}: ModalGeneratePdfProps) {
  const handleChangeOpenModal = (open: boolean) => {
    if (!open) {
      setOpen(true);
      return;
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleChangeOpenModal}>
      <DialogContent className="max-w-[95vw] w-full sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">
            Generación de PDF
          </DialogTitle>
          <DialogDescription className="text-center sr-only">
            Estamos generando el PDF
          </DialogDescription>
          <Separator className="mt-4" />
        </DialogHeader>
        <section className="space-y-6 py-4 flex flex-col items-center justify-center">
          <FileText className="size-14 text-muted-foreground animate-bounce" />

          <div className="text-center space-y-2">
            <h3 className="text-base font-medium">Generando PDF</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {download?.isDownload && !download?.isProcessing
                ? "Tu documento ha sido generado correctamente y está listo para ser descargado."
                : "Estamos procesando tu documento. Por favor espera un momento mientras se completa la generación del PDF."}
            </p>
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
