import { Mail, Shield, User as UserIcon } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileInformationLoading() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-linear-to-r from-primary/10 via-primary/5 to-background pb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Skeleton */}
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
            <AvatarFallback className="bg-primary/20">
              <Skeleton className="h-8 w-8 rounded-full" />
            </AvatarFallback>
          </Avatar>

          {/* User Info Skeleton */}
          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-2xl sm:text-3xl">
                <Skeleton className="h-9 w-64" />
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                <Skeleton className="h-4 w-16" />
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 opacity-50" />
              <Skeleton className="h-4 w-24" />
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Personal Information Section Skeleton */}
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
                  value=""
                  disabled
                  placeholder="Cargando..."
                  className="bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short-name">Nombre Corto</Label>
                <Input
                  id="short-name"
                  value=""
                  disabled
                  placeholder="Cargando..."
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Details Section Skeleton */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Detalles de la Cuenta
            </h3>
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Rol</p>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Badge variant="outline">
                  <Shield className="h-3 w-3 mr-1 opacity-50" />
                  <Skeleton className="h-3 w-16" />
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Estado de la Cuenta</p>
                  <Skeleton className="h-4 w-32" />
                </div>
                <Badge variant="secondary">
                  <Skeleton className="h-4 w-16" />
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
