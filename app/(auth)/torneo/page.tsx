"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, FileText, Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTournamentsListQuery } from "./_components/services/use-tournaments-list.query";

type TabValue = "all" | "active" | "upcoming" | "completed";

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  // Fetch tournaments based on active tab
  const { data: tournaments, isLoading } = useTournamentsListQuery(
    activeTab === "all"
      ? {}
      : activeTab === "active"
        ? { tournament_state: "active" }
        : activeTab === "upcoming"
          ? { tournament_state: "draft" }
          : { tournament_state: "completed" },
  );

  const getTournamentStateLabel = (state: string) => {
    const labels: Record<
      string,
      {
        text: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      draft: { text: "Borrador", variant: "secondary" },
      active: { text: "Activo", variant: "default" },
      in_progress: { text: "En Progreso", variant: "outline" },
      completed: { text: "Completado", variant: "outline" },
      cancelled: { text: "Cancelado", variant: "destructive" },
    };
    return labels[state] || { text: state, variant: "outline" };
  };

  const renderTournamentsList = () => {
    if (isLoading) {
      return (
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-center py-16">
              <p className="text-muted-foreground">Cargando torneos...</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!tournaments || tournaments.length === 0) {
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

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tournaments.map((tournament) => {
          const stateLabel = getTournamentStateLabel(
            tournament.tournament_state,
          );
          return (
            <Link key={tournament.id} href={`/torneo/${tournament.id}`}>
              <Card className="border-2 hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">
                          {tournament.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {tournament.game_name} ({tournament.game_type})
                        </p>
                      </div>
                      <Badge variant={stateLabel.variant}>
                        {stateLabel.text}
                      </Badge>
                    </div>

                    {/* Description */}
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tournament.description}
                      </p>
                    )}

                    {/* Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {tournament.max_participants && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>Máx. {tournament.max_participants}</span>
                        </div>
                      )}
                      {tournament.start_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDistanceToNow(
                              new Date(tournament.start_date),
                              {
                                addSuffix: true,
                                locale: es,
                              },
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Torneos
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona y participa en torneos competitivos
            </p>
          </div>
          <Link href="/torneo/nuevo">
            <Button size="lg" className="gap-2">
              <Plus className="w-4 h-4" />
              Crear Torneo
            </Button>
          </Link>
        </div>

        {/* Tabs for filtering */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabValue)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {renderTournamentsList()}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {renderTournamentsList()}
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            {renderTournamentsList()}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {renderTournamentsList()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
