import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParticipantsListEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Participantes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full mb-3">
            <Users className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Aún no hay participantes
            </p>
            <p className="text-xs text-muted-foreground">
              Sé el primero en unirte al torneo
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
