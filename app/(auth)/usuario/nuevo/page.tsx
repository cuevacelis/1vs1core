"use client";

import { revalidateLogic } from "@tanstack/react-form";
import { ArrowLeft, CheckCircle, Copy, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { z } from "zod";
import { useAppForm } from "@/components/form/hooks/use-form";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userCreateSchema } from "./_components/schemas/user-create.schema";
import { useUserCreateMutation } from "./_components/services/use-user-create.mutation";

export default function NewUserPage() {
  const router = useRouter();
  const createMutation = useUserCreateMutation();
  const [createdUser, setCreatedUser] = useState<{
    id: number;
    name: string;
    access_code: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Define default values with type inference from schema
  const defaultValues: z.input<typeof userCreateSchema> = {
    name: "",
    short_name: "",
    role: "player",
    url_image: "",
  };

  // Initialize form with TanStack Form
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: userCreateSchema,
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(
        {
          name: value.name,
          short_name: value.short_name || undefined,
          role: value.role,
          url_image: value.url_image || undefined,
        },
        {
          onSuccess: (data) => {
            setCreatedUser({
              id: data.id,
              name: data.name,
              access_code: data.access_code,
            });
          },
        },
      );
    },
  });

  const handleCopyCode = () => {
    if (createdUser?.access_code) {
      navigator.clipboard.writeText(createdUser.access_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateAnother = () => {
    setCreatedUser(null);
    form.reset();
  };

  // If user was created successfully, show success message
  if (createdUser) {
    return (
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/usuario">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                Usuario Creado Exitosamente
              </h1>
              <p className="text-muted-foreground mt-1">
                El usuario ha sido creado correctamente
              </p>
            </div>
          </div>

          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">
              ¡Usuario creado con éxito!
            </AlertTitle>
            <AlertDescription className="text-green-600">
              El usuario <strong>{createdUser.name}</strong> ha sido creado. A
              continuación encontrarás el código de acceso generado.
            </AlertDescription>
          </Alert>

          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="text-destructive">
                ⚠️ Código de Acceso - Guárdalo ahora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>IMPORTANTE:</strong> Este código de acceso solo se
                  mostrará una vez. No podrá ser recuperado más tarde. Asegúrate
                  de guardarlo en un lugar seguro.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="access-code">Código de Acceso</Label>
                <div className="flex gap-2">
                  <Input
                    id="access-code"
                    value={createdUser.access_code}
                    readOnly
                    className="font-mono text-lg"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                  >
                    {copiedCode ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {copiedCode && (
                  <p className="text-sm text-green-600">
                    ✓ Código copiado al portapapeles
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateAnother}
                >
                  Crear Otro Usuario
                </Button>
                <Link href="/usuario">
                  <Button>Volver a la Lista</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Otherwise, show creation form
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
              <UserPlus className="w-8 h-8 text-primary" />
              Crear Nuevo Usuario
            </h1>
            <p className="text-muted-foreground mt-1">
              Registra un nuevo usuario en el sistema
            </p>
          </div>
        </div>

        {/* Form */}
        <MutationStatusHandler mutations={[createMutation]}>
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
                      schema={userCreateSchema}
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
                      schema={userCreateSchema}
                      inputProps={{
                        placeholder: "Ej: juanp",
                        maxLength: 50,
                      }}
                    />
                  )}
                </form.AppField>

                {/* Role */}
                <form.AppField name="role">
                  {(field) => (
                    <field.ComboboxSingleSelectionField
                      label="Rol"
                      schema={userCreateSchema}
                      options={[
                        {
                          value: "player",
                          label: "Jugador - Usuario estándar",
                        },
                        {
                          value: "admin",
                          label: "Administrador - Acceso completo",
                        },
                      ]}
                      placeholder="Selecciona un rol"
                    />
                  )}
                </form.AppField>

                {/* URL Image */}
                <form.AppField name="url_image">
                  {(field) => (
                    <field.TextField
                      label="URL de Imagen de Perfil"
                      schema={userCreateSchema}
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
                      disabled={createMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <form.SubscribeButton label="Crear Usuario" />
                  </div>
                </form.AppForm>
              </form>
            </CardContent>
          </Card>
        </MutationStatusHandler>
      </div>
    </div>
  );
}
