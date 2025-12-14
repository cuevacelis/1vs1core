"use client";

import {
  ArrowUpRight,
  Award,
  Clock,
  Loader2,
  Swords,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useMatchActiveQuery } from "./_components/services/use-match-active.query";
import { useUserMeQuery } from "./_components/services/use-user-me.query";
import { useUserRecentMatchesQuery } from "./_components/services/use-user-recent-matches.query";
import { useUserStatsQuery } from "./_components/services/use-user-stats.query";
import { useUserTournamentsQuery } from "./_components/services/use-user-tournaments.query";

export default function Dashboard() {
  // Individual query hooks following TanStack Query best practices
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useUserMeQuery();
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useUserStatsQuery();
  const {
    data: activeMatch,
    isLoading: activeMatchLoading,
    error: activeMatchError,
  } = useMatchActiveQuery();
  const {
    data: recentMatches = [],
    isLoading: recentMatchesLoading,
    error: recentMatchesError,
  } = useUserRecentMatchesQuery({ limit: 10, offset: 0 });
  const {
    data: tournaments = [],
    isLoading: tournamentsLoading,
    error: tournamentsError,
  } = useUserTournamentsQuery({ limit: 10, offset: 0 });

  // Combined loading and error states
  const isLoading =
    userLoading ||
    statsLoading ||
    activeMatchLoading ||
    recentMatchesLoading ||
    tournamentsLoading;
  const error =
    userError ||
    statsError ||
    activeMatchError ||
    recentMatchesError ||
    tournamentsError;

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Cargando tu dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Error al cargar los datos del dashboard. Por favor, intenta de nuevo
            más tarde.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            ¡Bienvenido de nuevo, {user?.name || "Jugador"}! Aquí está tu
            resumen del torneo
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
            <div className="text-2xl font-bold">
              {stats?.tournamentsJoined || 0}
            </div>
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
            <div className="text-2xl font-bold">{stats?.totalMatches || 0}</div>
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
            <div className="text-2xl font-bold">{stats?.winRate || 0}%</div>
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Torneo
                    </p>
                    <p className="text-lg font-semibold">
                      {activeMatch.tournament_name}
                    </p>
                  </div>
                  <Badge variant="outline">Ronda {activeMatch.round}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {activeMatch.player1_id === user?.id ? "Tú" : "Oponente"}
                    </p>
                    <p className="font-semibold">{activeMatch.player1_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {activeMatch.player2_id === user?.id ? "Tú" : "Oponente"}
                    </p>
                    <p className="font-semibold">{activeMatch.player2_name}</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button asChild className="w-full">
                    <Link href="/player">Ir a la Partida</Link>
                  </Button>
                </div>
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
              <span className="text-2xl font-bold">{stats?.wins || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Derrotas</span>
              <span className="text-2xl font-bold">{stats?.losses || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Racha</span>
              <Badge
                variant={
                  stats?.currentStreak && stats.currentStreak > 0
                    ? "default"
                    : "outline"
                }
              >
                {stats?.currentStreak || 0}{" "}
                {stats?.currentStreak === 1 ? "victoria" : "victorias"}
              </Badge>
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
                          {match.tournament_name}
                        </TableCell>
                        <TableCell>{match.opponent_name}</TableCell>
                        <TableCell>{match.my_champion || "N/A"}</TableCell>
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
                          {new Date(match.match_date).toLocaleDateString(
                            "es-ES",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
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
                Mis Torneos
              </CardTitle>
              <CardDescription>
                Torneos en los que estás participando
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournaments.length === 0 ? (
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
              ) : (
                <div className="space-y-4">
                  {tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <h4 className="font-semibold">{tournament.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {tournament.game_name}
                          </Badge>
                          <span>•</span>
                          <span>
                            {tournament.tournament_state === "active" &&
                              "Activo"}
                            {tournament.tournament_state === "in_progress" &&
                              "En Progreso"}
                            {tournament.tournament_state === "completed" &&
                              "Completado"}
                            {tournament.tournament_state === "draft" &&
                              "Borrador"}
                          </span>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/torneo/${tournament.id}`}>
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
