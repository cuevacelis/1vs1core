"use client";

import { Trophy, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { client } from "@/lib/orpc/orpc.client";

export default function Home() {
  const [accessCode, setAccessCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // oRPC client returns the data directly, not a Response object
      await client.auth.login({ accessCode });

      // Redirect to dashboard after successful login
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
      setError("Código de acceso inválido. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/30 to-background">
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-16 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight mb-4">
              Bienvenido a 1v1 Core
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tu plataforma definitiva para torneos competitivos 1v1 con
              selección de campeones en tiempo real
            </p>
          </div>

          {/* Login Card */}
          <Card className="max-w-md mx-auto shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center">
                Acceso al Torneo
              </CardTitle>
              <CardDescription className="text-center">
                Ingresa tu código de acceso para unirte a la competencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Código de Acceso</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    placeholder="Ingresa tu código de acceso"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11"
                  size="lg"
                >
                  {isLoading ? "Ingresando..." : "Ingresar al Torneo"}
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <p className="text-center text-sm text-muted-foreground w-full">
                ¿No tienes un código de acceso? Contacta a un administrador del
                torneo.
              </p>
            </CardFooter>
          </Card>

          {/* Features Section */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Partidas Competitivas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Experimenta intensas batallas 1v1 con emparejamiento justo y
                  actualizaciones en tiempo real
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Selección en Tiempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Elige tu campeón en tiempo real con actualizaciones en vivo
                  para transmisión
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Gestión de Torneos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Organización optimizada de torneos con controles de
                  administración y seguimiento de jugadores
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
