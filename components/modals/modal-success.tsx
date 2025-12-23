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
import { SuccessMessage } from "../validate/message/success-message";

interface SuccessModalProps {
  onOpen: boolean;
  onClose: () => void;
  msgAditionalSuccess?: string[] | string;
}

export function ModalSuccess({
  onOpen,
  onClose,
  msgAditionalSuccess,
}: SuccessModalProps) {
  return (
    <>
      {onOpen && (
        <Dialog open={onOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-linear-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <DialogHeader className="sr-only">
              <DialogTitle>Modal Success</DialogTitle>
              <DialogDescription>Información de éxito</DialogDescription>
            </DialogHeader>
            <section className="p-6">
              <div className="text-center mb-4">
                <h6 className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
                  ¡SE PROCESÓ CORRECTAMENTE!
                </h6>
                <SuccessMessage
                  modeView="card"
                  message={msgAditionalSuccess}
                  className="bg-white! dark:bg-green-950!"
                />
              </div>
              <DialogFooter className="sm:justify-center">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-6 py-2 bg-white dark:bg-green-950 text-green-600 dark:text-green-300 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900 transition-colors duration-200"
                >
                  Aceptar
                </Button>
              </DialogFooter>
            </section>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
