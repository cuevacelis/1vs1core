"use client";

import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGamesListQuery } from "../_components/services/use-games-list.query";
import { useTournamentCreateMutation } from "./_components/services/use-tournament-create.mutation";

export default function NewTournamentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    game_id: "",
    start_date: "",
    end_date: "",
    max_participants: "",
  });

  // Fetch available games
  const { data: games, isLoading: gamesLoading } = useGamesListQuery();

  // Tournament creation mutation
  const createMutation = useTournamentCreateMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        game_id: parseInt(formData.game_id, 10),
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        max_participants: formData.max_participants
          ? parseInt(formData.max_participants, 10)
          : undefined,
      });

      toast.success("Torneo creado exitosamente", {
        description: "El torneo ha sido creado y está en estado borrador.",
      });

      router.push("/torneo");
      router.refresh();
    } catch (error) {
      toast.error("Error al crear torneo", {
        description:
          error instanceof Error
            ? error.message
            : "Ocurrió un error inesperado",
      });
    }
  };

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/torneo">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-primary" />
              Crear Nuevo Torneo
            </h1>
            <p className="text-muted-foreground mt-1">
              Configura un nuevo torneo competitivo
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Torneo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tournament Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nombre del Torneo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Copa de Primavera 2025"
                  maxLength={200}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe las reglas y detalles del torneo"
                />
              </div>

              {/* Game Selection */}
              <div className="space-y-2">
                <Label htmlFor="game">
                  Juego <span className="text-destructive">*</span>
                </Label>
                <Select
                  required
                  value={formData.game_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, game_id: value })
                  }
                >
                  <SelectTrigger id="game">
                    <SelectValue placeholder="Selecciona un juego" />
                  </SelectTrigger>
                  <SelectContent>
                    {gamesLoading ? (
                      <SelectItem value="loading" disabled>
                        Cargando juegos...
                      </SelectItem>
                    ) : games && games.length > 0 ? (
                      games.map((game) => (
                        <SelectItem key={game.id} value={game.id.toString()}>
                          {game.name} ({game.type})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No hay juegos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="start_date"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Fecha de Inicio
                  </Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Finalización
                  </Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    min={formData.start_date}
                  />
                </div>
              </div>

              {/* Max Participants */}
              <div className="space-y-2">
                <Label htmlFor="max_participants">
                  Máximo de Participantes
                </Label>
                <Input
                  id="max_participants"
                  type="number"
                  min="2"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_participants: e.target.value,
                    })
                  }
                  placeholder="Dejar vacío para ilimitado"
                />
                <p className="text-sm text-muted-foreground">
                  Dejar vacío para no tener límite de participantes
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creando..." : "Crear Torneo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
