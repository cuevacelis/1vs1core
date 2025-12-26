import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TournamentsListEmptyProps {
  activeTab: "all" | "active" | "upcoming" | "completed";
}

export function TournamentsListEmpty({ activeTab }: TournamentsListEmptyProps) {
  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <FileText className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            No se encontraron torneos
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeTab === "all"
              ? "Crea tu primer torneo para comenzar"
              : `No hay torneos ${
                  activeTab === "active"
                    ? "activos"
                    : activeTab === "upcoming"
                      ? "próximos"
                      : "completados"
                }`}
          </p>
          {activeTab === "all" && (
            <Link href="/torneo/nuevo">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Crear Torneo
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
