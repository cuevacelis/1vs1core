"use client";

import { Calendar, FileText, Plus, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TournamentsPage() {
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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="completed">Completados</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
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
                    Crea tu primer torneo para comenzar
                  </p>
                  <Link href="/torneo/nuevo">
                    <Button variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Crear Torneo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Trophy className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No hay torneos activos
                  </h3>
                  <p className="text-muted-foreground">
                    Los torneos activos aparecerán aquí
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Calendar className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No hay torneos próximos
                  </h3>
                  <p className="text-muted-foreground">
                    Los torneos próximos aparecerán aquí
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    No hay torneos completados
                  </h3>
                  <p className="text-muted-foreground">
                    Los torneos completados aparecerán aquí
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
