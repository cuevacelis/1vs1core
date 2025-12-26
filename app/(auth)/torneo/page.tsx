"use client";

import { Plus, Trophy } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentsList } from "./_components/tournaments-list/tournaments-list";

type TabValue = "all" | "active" | "upcoming" | "completed";

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");

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
          <TabsList className="grid w-full grid-cols-4 lg:w-125">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <TournamentsList activeTab="all" />
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <TournamentsList activeTab="active" />
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <TournamentsList activeTab="upcoming" />
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <TournamentsList activeTab="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
