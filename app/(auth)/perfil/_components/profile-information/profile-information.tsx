"use client";

import { Mail, Shield, User as UserIcon } from "lucide-react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ProfileInformationEmpty } from "./empity-state/profile-information-empty";
import { ProfileInformationLoading } from "./loading/profile-information-loading";
import { useUserProfileQuery } from "./services/use-user-profile.query";

export function ProfileInformation() {
  const profileQuery = useUserProfileQuery();

  const profile = profileQuery.data;

  const displayName =
    profile?.person?.first_name && profile?.person?.paternal_last_name
      ? `${profile.person.first_name} ${profile.person.paternal_last_name}`
      : profile?.name || "Nombre de Usuario";

  const shortName = profile?.short_name || "N/A";
  const roleName = profile?.role?.name || "Jugador";
  const isActive = profile?.state === "active";

  const firstInitial =
    profile?.person?.first_name?.[0]?.toUpperCase() ||
    profile?.name?.[0]?.toUpperCase() ||
    "U";
  const secondInitial =
    profile?.person?.paternal_last_name?.[0]?.toUpperCase() || "";

  return (
    <QueryStatusHandler
      queries={[profileQuery]}
      customLoadingComponent={<ProfileInformationLoading />}
      emptyStateComponent={<ProfileInformationEmpty />}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-linear-to-r from-primary/10 via-primary/5 to-background pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarFallback className="text-2xl font-bold bg-primary/20 text-primary">
                {firstInitial}
                {secondInitial}
              </AvatarFallback>
            </Avatar>

            {/* User Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <CardTitle className="text-2xl sm:text-3xl">
                  {displayName}
                </CardTitle>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className="w-fit"
                >
                  {isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4" />
                {roleName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Información Personal
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Nombre Completo</Label>
                  <Input
                    id="display-name"
                    value={displayName}
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short-name">Nombre Corto</Label>
                  <Input
                    id="short-name"
                    value={shortName}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Details Section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Detalles de la Cuenta
              </h3>
              <div className="grid gap-4">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Rol</p>
                    <p className="text-sm text-muted-foreground">{roleName}</p>
                  </div>
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    {roleName}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                  <div>
                    <p className="text-sm font-medium">Estado de la Cuenta</p>
                    <p className="text-sm text-muted-foreground">
                      Tu cuenta está {isActive ? "activa" : "inactiva"}
                    </p>
                  </div>
                  <Badge variant={isActive ? "default" : "secondary"}>
                    {isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
