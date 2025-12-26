"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Button } from "@/components/ui/button";
import { DashboardHeaderLoading } from "./loading/dashboard-header-loading";
import { useUserMeQuery } from "./services/use-user-me.query";

export function DashboardHeader() {
  const userQuery = useUserMeQuery();

  const user = userQuery.data;
  const userName = user?.name || "Jugador";

  return (
    <QueryStatusHandler
      queries={[userQuery]}
      customLoadingComponent={<DashboardHeaderLoading />}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            ¡Bienvenido de nuevo, {userName}! Aquí está tu resumen del torneo
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
    </QueryStatusHandler>
  );
}
