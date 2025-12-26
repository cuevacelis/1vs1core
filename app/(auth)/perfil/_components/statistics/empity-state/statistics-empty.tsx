import { Award, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatisticsEmpty() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Estadísticas</CardTitle>
              <CardDescription>Resumen de rendimiento</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
              <Trophy className="h-16 w-16 text-muted-foreground/30" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Aún no tienes estadísticas
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Parece que aún no has participado en ninguna partida. Únete a un
                torneo y comienza a competir para ver tus estadísticas aquí.
              </p>
            </div>

            <div className="pt-4">
              <p className="text-xs text-muted-foreground italic">
                ¡Tu primera victoria está a solo una partida de distancia!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
