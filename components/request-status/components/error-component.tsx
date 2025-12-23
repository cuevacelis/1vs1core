import { IconCheck, IconCopy } from "@tabler/icons-react";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

interface IProps {
  message?: string[] | string | null;
  className?: string;
}

export function ErrorComponent({ message, className }: IProps) {
  const [isCopied, setIsCopied] = useState(false);

  const hasDetails =
    (typeof message === "string" && message.trim().length > 0) ||
    (Array.isArray(message) && message.length > 0);

  const errorDetails =
    typeof message === "string"
      ? message
      : Array.isArray(message)
        ? message.join("\n")
        : "";

  const handleCopy = () => {
    navigator.clipboard
      .writeText(errorDetails)
      .then(() => {
        setIsCopied(true);
        toast.success("Detalles copiados al portapapeles");
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      })
      .catch(() => {
        toast.error("No se pudo copiar los detalles");
      });
  };

  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center py-8 px-4",
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-2xl w-full space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-semibold tracking-tight">
              Error al cargar los datos
            </h3>
            <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
              No se pudieron cargar los datos desde el servidor. Por favor,
              intenta nuevamente o contacta al soporte si el problema persiste.
            </p>
          </div>
        </div>

        {hasDetails && (
          <InputGroup className="bg-background border border-border rounded-md shadow-sm">
            <InputGroupTextarea
              id="error-details"
              value={errorDetails}
              readOnly
              className="h-40 text-sm font-mono text-red-600"
              aria-label="Detalles del error"
            />
            <InputGroupAddon align="block-end" className="border-t">
              <InputGroupText className="text-xs">
                Detalles del error
              </InputGroupText>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                className="ml-auto"
                onClick={handleCopy}
                aria-label="Copiar detalles del error"
              >
                {isCopied ? (
                  <IconCheck className="size-4 text-green-500" />
                ) : (
                  <IconCopy className="size-4" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        )}

        {!hasDetails && (
          <Alert className="border-muted">
            <AlertDescription className="text-sm text-muted-foreground text-center">
              No se proporcionaron detalles adicionales sobre el error.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </section>
  );
}
