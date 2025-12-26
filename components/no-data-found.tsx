import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface NoDataFoundProps {
  message?: string;
  submessage?: string;
  messageButton?: string;
  onReset?: () => void;
  showResetButton?: boolean;
}

export function NoDataFound({
  message = "No se encontraron datos",
  submessage = "Intenta ajustar tus filtros o criterios de búsqueda",
  messageButton = "Restablecer filtros",
  onReset,
  showResetButton = false,
}: NoDataFoundProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-16 rounded-full">
          <SearchX className="size-10" />
        </EmptyMedia>
        <EmptyTitle>{message}</EmptyTitle>
        <EmptyDescription>{submessage}</EmptyDescription>
      </EmptyHeader>

      <EmptyContent>
        {showResetButton && onReset && (
          <Button variant="outline" onClick={onReset}>
            {messageButton}
          </Button>
        )}
      </EmptyContent>
    </Empty>
  );
}
