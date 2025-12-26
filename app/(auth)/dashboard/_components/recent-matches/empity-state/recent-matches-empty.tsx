import { Award, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function RecentMatchesEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Historial de Partidas
        </CardTitle>
        <CardDescription>
          Tu historial de partidas y rendimiento
        </CardDescription>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
            <Zap className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sin partidas recientes</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Tu historial de partidas aparecerá aquí una vez que comiences a
              jugar
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
