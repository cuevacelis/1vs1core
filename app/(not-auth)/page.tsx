"use client";

import { Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLoginMutation } from "./_components/services/use-login.mutation";

export default function Home() {
  const [accessCode, setAccessCode] = useState("");
  const router = useRouter();
  const loginMutation = useLoginMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await loginMutation.mutateAsync({ accessCode: accessCode.trim() });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-muted/20 to-background">
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-12 sm:mb-16 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-linear-to-br from-primary/20 to-primary/10 mb-4 shadow-lg ring-4 ring-primary/10">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>

            <div className="space-y-4">
              <Badge
                variant="secondary"
                className="px-4 py-1.5 text-sm font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 inline" />
                Plataforma de Torneos 1v1
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Bienvenido a 1v1 Core
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Tu plataforma definitiva para torneos competitivos 1v1 con
                selección de campeones en tiempo real
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="max-w-md mx-auto shadow-xl border-2 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-150">
            <CardContent className="pt-6">
              <MutationStatusHandler
                mutations={[loginMutation]}
                hideLoadingModal
                hideErrorModal
                hideSuccessModal
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="accessCode"
                      className="text-base font-medium"
                    >
                      Código de Acceso
                    </Label>
                    <Input
                      id="accessCode"
                      type="text"
                      placeholder="Ej: ABC123XYZ456"
                      value={accessCode}
                      onChange={(e) =>
                        setAccessCode(e.target.value.toUpperCase())
                      }
                      required
                      disabled={loginMutation.isPending}
                      className="h-12 text-base font-mono tracking-wider"
                      autoComplete="off"
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      El código debe ser proporcionado por un administrador
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginMutation.isPending || !accessCode.trim()}
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                  >
                    {loginMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Verificando acceso...
                      </>
                    ) : (
                      "Ingresar al Torneo"
                    )}
                  </Button>
                </form>
              </MutationStatusHandler>
            </CardContent>

            <Separator />

            <CardFooter className="flex flex-col space-y-2 pt-6">
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes un código de acceso?
              </p>
              <p className="text-center text-xs text-muted-foreground">
                Contacta a un administrador del torneo para obtener tu código
                único
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
