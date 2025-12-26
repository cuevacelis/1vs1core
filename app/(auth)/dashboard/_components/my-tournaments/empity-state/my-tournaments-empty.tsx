import { Trophy } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MyTournamentsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Mis Torneos
        </CardTitle>
        <CardDescription>Torneos en los que estás participando</CardDescription>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
            <Trophy className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Sin torneos activos</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Únete a un torneo para comenzar a competir
            </p>
          </div>
          <Button asChild>
            <Link href="/torneo">Explorar Torneos</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
