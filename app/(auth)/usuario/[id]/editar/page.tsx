"use client";

import { revalidateLogic } from "@tanstack/react-form";
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import type { z } from "zod";
import { useAppForm } from "@/components/form/hooks/use-form";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userEditSchema } from "./_components/schemas/user-edit.schema";
import { useUserDetailQuery } from "./_components/services/use-user-detail.query";
import { useUserUpdateMutation } from "./_components/services/use-user-update.mutation";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const userId = Number.parseInt(id, 10);

  // Fetch user data
  const userQuery = useUserDetailQuery(userId);
  const user = userQuery.data;

  // User update mutation
  const updateMutation = useUserUpdateMutation();

  // Define default values with type inference from schema
  const defaultValues: z.input<typeof userEditSchema> = {
    name: user?.name ?? "",
    short_name: user?.short_name ?? "",
    state: user?.state ?? "active",
    url_image: user?.url_image ?? "",
  };

  // Initialize form with TanStack Form
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: userEditSchema,
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate(
        {
          id: userId,
          name: value.name,
          short_name: value.short_name || undefined,
          state: value.state,
          url_image: value.url_image || undefined,
        },
        {
          onSuccess: () => {
            router.push("/usuario");
            router.refresh();
          },
        },
      );
    },
  });

  // Reset form when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset();
    }
  }, [user, form]);

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/usuario">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Pencil className="w-8 h-8 text-primary" />
              Editar Usuario
            </h1>
            <p className="text-muted-foreground mt-1">
              Modifica los detalles del usuario
            </p>
          </div>
        </div>

        {/* Form */}
        <QueryStatusHandler queries={[userQuery]} hideNoDataMessage>
          <MutationStatusHandler mutations={[updateMutation]}>
            <Card>
              <CardHeader>
                <CardTitle>Información del Usuario</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="space-y-6"
                >
                  {/* User Name */}
                  <form.AppField name="name">
                    {(field) => (
                      <field.TextField
                        label="Nombre Completo"
                        schema={userEditSchema}
                        inputProps={{
                          placeholder: "Ej: Juan Pérez",
                          maxLength: 100,
                        }}
                      />
                    )}
                  </form.AppField>

                  {/* Short Name */}
                  <form.AppField name="short_name">
                    {(field) => (
                      <field.TextField
                        label="Nombre Corto / Alias"
                        schema={userEditSchema}
                        inputProps={{
                          placeholder: "Ej: juanp",
                          maxLength: 50,
                        }}
                      />
                    )}
                  </form.AppField>

                  {/* State */}
                  <form.AppField name="state">
                    {(field) => (
                      <field.ComboboxSingleSelectionField
                        label="Estado"
                        schema={userEditSchema}
                        options={[
                          {
                            value: "active",
                            label: "Activo - Usuario habilitado",
                          },
                          {
                            value: "suspended",
                            label: "Suspendido - Temporalmente deshabilitado",
                          },
                          {
                            value: "banned",
                            label: "Bloqueado - Permanentemente deshabilitado",
                          },
                          {
                            value: "pending_verification",
                            label: "Pendiente - Esperando verificación",
                          },
                        ]}
                        placeholder="Selecciona el estado"
                      />
                    )}
                  </form.AppField>

                  {/* URL Image */}
                  <form.AppField name="url_image">
                    {(field) => (
                      <field.TextField
                        label="URL de Imagen de Perfil"
                        schema={userEditSchema}
                        inputProps={{
                          placeholder: "https://ejemplo.com/imagen.jpg",
                          type: "url",
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
