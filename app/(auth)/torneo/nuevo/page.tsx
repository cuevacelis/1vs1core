"use client";

import { revalidateLogic } from "@tanstack/react-form";
import { ArrowLeft, Calendar, Trophy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { useAppForm } from "@/components/form/hooks/use-form";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamesListQuery } from "../_components/services/use-games-list.query";
import { tournamentCreateSchema } from "./_components/schemas/tournament-create.schema";
import { useTournamentCreateMutation } from "./_components/services/use-tournament-create.mutation";

export default function NewTournamentPage() {
  const router = useRouter();

  // Fetch available games
  const gamesQuery = useGamesListQuery();

  // Tournament creation mutation
  const createMutation = useTournamentCreateMutation();

  // Define default values with type inference from schema
  const defaultValues: z.input<typeof tournamentCreateSchema> = {
    name: "",
    description: "",
    game_id: "",
    state: "draft",
    start_date: "",
    end_date: "",
    max_participants: "",
  };

  // Initialize form with TanStack Form
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: tournamentCreateSchema,
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(
        {
          name: value.name,
          description: value.description,
          game_id: Number.parseInt(value.game_id, 10),
          state: value.state,
          start_date: value.start_date || undefined,
          end_date: value.end_date || undefined,
          max_participants: value.max_participants
            ? Number.parseInt(value.max_participants, 10)
            : undefined,
        },
        {
          onSuccess: () => {
            router.push("/torneo");
            router.refresh();
          },
        },
      );
    },
  });

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
        <QueryStatusHandler queries={[gamesQuery]} hideNoDataMessage>
          <MutationStatusHandler mutations={[createMutation]}>
            <Card>
              <CardHeader>
                <CardTitle>Información del Torneo</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="space-y-6"
                >
                  {/* Tournament Name */}
                  <form.AppField name="name">
                    {(field) => (
                      <field.TextField
                        label={<>Nombre del Torneo </>}
                        schema={tournamentCreateSchema}
                        inputProps={{
                          placeholder: "Ej: Copa de Primavera 2025",
                          maxLength: 200,
                        }}
                      />
                    )}
                  </form.AppField>

                  {/* Description */}
                  <form.AppField name="description">
                    {(field) => (
                      <field.TextareaField
                        label="Descripción"
                        schema={tournamentCreateSchema}
                        textareaProps={{
                          rows: 4,
                          placeholder:
                            "Describe las reglas y detalles del torneo",
                        }}
                      />
                    )}
                  </form.AppField>

                  {/* Game Selection */}
                  <form.AppField name="game_id">
                    {(field) => (
                      <field.ComboboxSingleSelectionField
                        label={<>Juego</>}
                        schema={tournamentCreateSchema}
                        options={
                          gamesQuery.data?.map((game) => ({
                            value: game.id.toString(),
                            label: `${game.name} (${game.type})`,
                          })) ?? []
                        }
                        placeholder="Selecciona un juego"
                      />
                    )}
                  </form.AppField>

                  {/* Tournament State */}
                  <form.AppField name="state">
                    {(field) => (
                      <field.ComboboxSingleSelectionField
                        label="Estado del Torneo"
                        schema={tournamentCreateSchema}
                        options={[
                          {
                            value: "draft",
                            label: "Borrador - No visible para inscripciones",
                          },
                          {
                            value: "active",
                            label: "Activo - Aceptando inscripciones",
                          },
                          {
                            value: "in_progress",
                            label: "En progreso - Torneo en curso",
                          },
                          {
                            value: "completed",
                            label: "Finalizado - Torneo terminado",
                          },
                          {
                            value: "cancelled",
                            label: "Cancelado",
                          },
                        ]}
                        placeholder="Selecciona el estado"
                      />
                    )}
                  </form.AppField>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form.AppField name="start_date">
                      {(field) => (
                        <field.TextField
                          label={
                            <>
                              <Calendar className="w-4 h-4 inline-block mr-2" />
                              Fecha de Inicio
                            </>
                          }
                          schema={tournamentCreateSchema}
                          inputProps={{
                            type: "datetime-local",
                          }}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="end_date">
                      {(field) => (
                        <field.TextField
                          label={
                            <>
                              <Calendar className="w-4 h-4 inline-block mr-2" />
                              Fecha de Finalización
                            </>
                          }
                          schema={tournamentCreateSchema}
                          inputProps={{
                            type: "datetime-local",
                          }}
                        />
                      )}
                    </form.AppField>
                  </div>

                  {/* Max Participants */}
                  <form.AppField name="max_participants">
                    {(field) => (
                      <field.TextField
                        label="Máximo de Participantes"
                        schema={tournamentCreateSchema}
                        inputProps={{
                          type: "number",
                          min: "2",
                          placeholder:
                            "Dejar vacío para no tener límite de participantes",
                        }}
                      />
                    )}
                  </form.AppField>

                  <form.AppForm>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={createMutation.isPending}
                      >
                        Cancelar
                      </Button>
                      <form.SubscribeButton label="Crear Torneo" />
                    </div>
                  </form.AppForm>
                </form>
              </CardContent>
            </Card>
          </MutationStatusHandler>
        </QueryStatusHandler>
      </div>
    </div>
  );
}
