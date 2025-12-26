import { Award, Percent, Swords, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function StatisticsLoading() {
  const statsData = [
    {
      label: "Partidas",
      icon: Swords,
      bgColor: "bg-blue-100 dark:bg-blue-950",
      iconColor: "text-blue-600",
    },
    {
      label: "Victorias",
      icon: Trophy,
      bgColor: "bg-green-100 dark:bg-green-950",
      iconColor: "text-green-600",
    },
    {
      label: "Derrotas",
      icon: X,
      bgColor: "bg-red-100 dark:bg-red-950",
      iconColor: "text-red-600",
    },
  ];

  return (
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
          {/* Stats Grid Skeleton */}
          <div className="space-y-3">
            {statsData.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${stat.bgColor} rounded-md`}>
                      <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium">{stat.label}</span>
                  </div>
                  <Skeleton className="h-8 w-12" />
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Win Rate Section Skeleton */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Percent className="h-4 w-4" />
              <span>Tasa de Victoria</span>
            </div>

            <div className="space-y-3">
              {/* Win Rate Bar Skeleton */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-10 w-24" />
                  <Badge variant="secondary" className="gap-1">
                    <Skeleton className="h-3 w-16" />
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <Skeleton className="h-full w-0" />
                </div>
              </div>

              {/* Win/Loss Ratio Skeleton */}
              <div className="flex items-center justify-between text-sm bg-muted/30 p-3 rounded-lg">
                <span className="text-muted-foreground">Radio V/D</span>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
