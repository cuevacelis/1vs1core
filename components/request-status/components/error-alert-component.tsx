import { IconX } from "@tabler/icons-react";
import { ServerCrashIcon } from "lucide-react";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

interface IProps {
  message?: string[] | string | null;
  className?: string;
}

export default function ErrorAlertComponent({ message, className }: IProps) {
  const [isShown, setIsShown] = useState(true);

  if (!isShown) {
    return null;
  }

  const errorDetailsList =
    typeof message === "string"
      ? [message]
      : Array.isArray(message)
        ? message
        : [];

  const isSingleError = errorDetailsList.length === 1;

  return (
    <Item variant="outline" className={cn("bg-red-600 text-white", className)}>
      <ItemMedia variant="default">
        <ServerCrashIcon />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Error al obtener los datos del servidor.</ItemTitle>
        <ItemDescription className="text-white">
          {isSingleError
            ? errorDetailsList[0]
            : `Se encontraron ${message?.length} errores del servidor.`}
        </ItemDescription>
        {!isSingleError && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="errors-items">
              <AccordionTrigger>Ver todos los errores</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                {errorDetailsList.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {errorDetailsList.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    Se ha producido un error desconocido. Por favor, inténtelo
                    de nuevo más tarde.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </ItemContent>
      <ItemActions>
        <Button size="sm" variant="ghost" onClick={() => setIsShown(false)}>
          <IconX className="size-5" />
        </Button>
      </ItemActions>
    </Item>
  );
}
