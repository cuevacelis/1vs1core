import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TournamentHeaderEmpty() {
  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
            <AlertCircle className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Torneo no encontrado</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No se pudo encontrar la información del torneo solicitado.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
