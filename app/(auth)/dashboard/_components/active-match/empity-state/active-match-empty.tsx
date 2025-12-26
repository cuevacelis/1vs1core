import { Swords, Target } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ActiveMatchEmpty() {
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Partida Activa
        </CardTitle>
        <CardDescription>Estado de tu partida actual</CardDescription>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
            <Swords className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sin partida activa</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Serás notificado cuando una partida esté lista. Mientras tanto,
              puedes explorar torneos disponibles.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
