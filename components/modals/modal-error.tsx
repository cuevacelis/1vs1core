"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorMessage } from "../validate/message/error-message";
import {
  type IMixedMessageItem,
  MixedMessage,
} from "../validate/message/mixed-message";

interface ErrorModalProps {
  onOpen: boolean;
  onClose: () => void;
  msgAditionalError?: string[] | string;
  mixedMessages?: IMixedMessageItem[];
  title?: string;
}

export function ModalError({
  onOpen,
  onClose,
  msgAditionalError,
  mixedMessages,
  title = "¡Atención!",
}: ErrorModalProps) {
  // Determinar si hay errores para el color del icono y botón
  const hasErrors = mixedMessages
    ? mixedMessages.some((item) => item.isError)
    : true; // Si no hay mixedMessages, asumimos que es un error

  // Determinar qué contenido mostrar
  const shouldShowMixedMessages = mixedMessages && mixedMessages.length > 0;

  return (
    <>
      {onOpen && (
        <Dialog open={onOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader className="sr-only">
              <DialogTitle>Modal Error</DialogTitle>
              <DialogDescription>Información de error</DialogDescription>
            </DialogHeader>
            <div className="text-center">
              <h5 className="text-xl font-bold text-foreground mb-2">
                {title}
              </h5>
              {shouldShowMixedMessages ? (
                <MixedMessage messages={mixedMessages} modeView="card" />
              ) : (
                <ErrorMessage message={msgAditionalError} modeView="card" />
              )}
            </div>
            <DialogFooter className="sm:justify-center">
              <Button
                onClick={onClose}
                className={`${
                  hasErrors
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300`}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
