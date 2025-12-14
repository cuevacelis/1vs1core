"use client";

import {
  ArrowUpRight,
  Award,
  Clock,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const activeMatch = null;

  // Mock data for recent matches
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const recentMatches: any[] = [
    // {
    //   id: 1,
    //   tournament: "Torneo de Primavera",
    //   opponent: "Jugador123",
    //   result: "Victoria",
    //   champion: "Campeón A",
    //   date: "2024-01-15",
    // },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            ¡Bienvenido de nuevo! Aquí está tu resumen del torneo
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/torneo">
              Ver Torneos
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Torneos</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Torneos unidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Partidas Jugadas
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Total de partidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Victoria
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Rendimiento general</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {/* Active Match - Takes 2 columns on xl screens */}
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Partida Activa
              </CardTitle>
              <CardDescription>Estado de tu partida actual</CardDescription>
            </div>
            {activeMatch && (
              <Badge className="ml-auto">
                <Clock className="mr-1 h-3 w-3" />
                En Progreso
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {!activeMatch ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Swords className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Sin partida activa
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Serás notificado cuando una partida esté lista. Mientras
                  tanto, puedes explorar torneos disponibles.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p>Los detalles de la partida aparecerán aquí</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Estadísticas Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Victorias</span>
              <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Derrotas</span>
              <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Racha</span>
              <Badge variant="outline">0</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Tabs defaultValue="matches" className="w-full">
        <TabsList>
          <TabsTrigger value="matches">Partidas Recientes</TabsTrigger>
          <TabsTrigger value="tournaments">Mis Torneos</TabsTrigger>
        </TabsList>
        <TabsContent value="matches" className="space-y-4">
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
            <CardContent>
              {recentMatches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Zap className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Sin partidas recientes
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Tu historial de partidas aparecerá aquí una vez que
                    comiences a jugar
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Torneo</TableHead>
                      <TableHead>Oponente</TableHead>
                      <TableHead>Campeón</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead className="text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {match.tournament}
                        </TableCell>
                        <TableCell>{match.opponent}</TableCell>
                        <TableCell>{match.champion}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              match.result === "Victoria"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {match.result}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {match.date}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tournaments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Torneos Activos
              </CardTitle>
              <CardDescription>
                Torneos en los que estás participando
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Trophy className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Sin torneos activos
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  Únete a un torneo para comenzar a competir
                </p>
                <Button asChild>
                  <Link href="/torneo">Explorar Torneos</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
