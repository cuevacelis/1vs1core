import { Trophy, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function TournamentDetailEmpty() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-16">
            <div className="text-center space-y-6">
              <div className="mx-auto w-fit p-6 bg-muted/30 rounded-full">
                <div className="relative">
                  <Trophy className="h-20 w-20 text-muted-foreground/30" />
                  <div className="absolute -top-2 -right-2 bg-background rounded-full p-1">
                    <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </div>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl font-bold">Torneo no encontrado</h2>
                <p className="text-muted-foreground">
                  El torneo que buscas no existe o ha sido eliminado.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4">
                <Link href="/torneo">
                  <Button>Ver todos los torneos</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
