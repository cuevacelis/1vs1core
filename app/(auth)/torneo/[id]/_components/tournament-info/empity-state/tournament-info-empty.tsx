import { AlertCircle, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TournamentInfoEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Información del Torneo
        </CardTitle>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
            <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-semibold">
              Información no disponible
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              No se pudo cargar la información del torneo.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
