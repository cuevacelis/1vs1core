"use client";

import { revalidateLogic } from "@tanstack/react-form";
import { ArrowLeft, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import type { z } from "zod";
import { useAppForm } from "@/components/form/hooks/use-form";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamesListQuery } from "../../_components/services/use-games-list.query";
import { useTournamentDetailQuery } from "../../_components/services/use-tournament-detail.query";
import { tournamentEditSchema } from "./_components/schemas/tournament-edit.schema";
import { useTournamentUpdateMutation } from "./_components/services/use-tournament-update.mutation";

export default function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const tournamentId = Number.parseInt(id, 10);

  // Fetch tournament data
  const tournamentQuery = useTournamentDetailQuery(tournamentId);
  const tournament = tournamentQuery.data;

  // Fetch available games
  const gamesQuery = useGamesListQuery();

  // Tournament update mutation
  const updateMutation = useTournamentUpdateMutation();

  // Define default values with type inference from schema
  const defaultValues: z.input<typeof tournamentEditSchema> = {
    name: tournament?.name ?? "",
    description: tournament?.description ?? "",
    game_id: tournament?.game_id.toString() ?? "",
    start_date: tournament?.start_date
      ? new Date(tournament.start_date).toISOString().slice(0, 16)
      : "",
    end_date: tournament?.end_date
      ? new Date(tournament.end_date).toISOString().slice(0, 16)
      : "",
    max_participants: tournament?.max_participants?.toString() ?? "",
  };

  // Initialize form with TanStack Form
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: tournamentEditSchema,
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate(
        {
          id: tournamentId,
          name: value.name,
          description: value.description || undefined,
          game_id: Number.parseInt(value.game_id, 10),
          start_date: value.start_date || undefined,
          end_date: value.end_date || undefined,
          max_participants: value.max_participants
            ? Number.parseInt(value.max_participants, 10)
            : undefined,
        },
        {
          onSuccess: () => {
            router.push(`/torneo/${tournamentId}`);
            router.refresh();
          },
        },
      );
    },
  });

  // Reset form when tournament data is loaded
  useEffect(() => {
    if (tournament) {
      form.reset();
    }
  }, [tournament, form]);

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/torneo/${tournamentId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Pencil className="w-8 h-8 text-primary" />
              Editar Torneo
            </h1>
            <p className="text-muted-foreground mt-1">
              Modifica los detalles del torneo
            </p>
          </div>
        </div>

        {/* Form */}
        <QueryStatusHandler
          queries={[tournamentQuery, gamesQuery]}
          hideNoDataMessage
        >
          <MutationStatusHandler mutations={[updateMutation]}>
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
                        label="Nombre del Torneo"
                        schema={tournamentEditSchema}
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
                        schema={tournamentEditSchema}
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
                        label="Juego"
                        schema={tournamentEditSchema}
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
                          schema={tournamentEditSchema}
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
                          schema={tournamentEditSchema}
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
                        schema={tournamentEditSchema}
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
                        disabled={updateMutation.isPending}
                      >
                        Cancelar
                      </Button>
                      <form.SubscribeButton label="Guardar Cambios" />
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
