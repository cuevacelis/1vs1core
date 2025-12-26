"use client";

import { Award, Percent, Swords, TrendingUp, Trophy, X } from "lucide-react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatisticsEmpty } from "./empity-state/statistics-empty";
import { StatisticsLoading } from "./loading/statistics-loading";
import { useUserMatchStatisticsQuery } from "./services/use-user-match-statistics.query";

export function Statistics() {
  const statsQuery = useUserMatchStatisticsQuery();

  const stats = statsQuery.data;
  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;
  const losses = stats?.losses || 0;
  const winRate = stats?.winRate || 0;

  const statsData = [
    {
      label: "Partidas",
      value: totalMatches,
      icon: Swords,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
      iconColor: "text-blue-600",
    },
    {
      label: "Victorias",
      value: wins,
      icon: Trophy,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
      iconColor: "text-green-600",
    },
    {
      label: "Derrotas",
      value: losses,
      icon: X,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-950",
      iconColor: "text-red-600",
    },
  ];

  return (
    <QueryStatusHandler
      queries={[statsQuery]}
      customLoadingComponent={<StatisticsLoading />}
      emptyStateComponent={<StatisticsEmpty />}
    >
      <div className="space-y-6">
        {/* Main Stats Card */}
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

          <CardContent className="space-y-6">
            {/* Stats Grid */}
            <div className="space-y-3">
              {statsData.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${stat.bgColor} rounded-md`}>
                        <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                      </div>
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Win Rate Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span>Tasa de Victoria</span>
              </div>

              <div className="space-y-3">
                {/* Win Rate Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-primary">
                      {winRate.toFixed(1)}%
                    </span>
                    {winRate >= 50 ? (
                      <Badge variant="default" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Excelente
                      </Badge>
                    ) : winRate >= 30 ? (
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Bueno
                      </Badge>
                    ) : totalMatches > 0 ? (
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        En progreso
                      </Badge>
                    ) : null}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${Math.min(winRate, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Win/Loss Ratio */}
                {totalMatches > 0 && (
                  <div className="flex items-center justify-between text-sm bg-muted/30 p-3 rounded-lg">
                    <span className="text-muted-foreground">Radio V/D</span>
                    <span className="font-semibold">
                      {wins} / {losses}
                    </span>
                  </div>
                )}

                {/* Empty State */}
                {totalMatches === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Aún no has jugado partidas</p>
                    <p className="text-xs mt-1">
                      ¡Participa en torneos para ver tus estadísticas!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </QueryStatusHandler>
  );
}
