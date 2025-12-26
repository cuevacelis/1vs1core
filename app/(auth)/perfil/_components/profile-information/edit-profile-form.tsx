"use client";

import { revalidateLogic } from "@tanstack/react-form";
import { useEffect } from "react";
import type { z } from "zod";
import { useAppForm } from "@/components/form/hooks/use-form";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { profileEditSchema } from "./schemas/profile-edit.schema";
import { useUpdateProfileMutation } from "./services/use-update-profile.mutation";

interface EditProfileFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentName: string;
  currentShortName: string | null;
}

export function EditProfileForm({
  open,
  setOpen,
  currentName,
  currentShortName,
}: EditProfileFormProps) {
  const updateProfileMutation = useUpdateProfileMutation();

  // Define default values with type inference from schema
  const defaultValues: z.input<typeof profileEditSchema> = {
    name: currentName,
    short_name: currentShortName ?? "",
  };

  // Initialize form with TanStack Form
  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    validators: {
      onDynamic: profileEditSchema,
    },
    onSubmit: async ({ value }) => {
      updateProfileMutation.mutate(
        {
          name: value.name,
          short_name: value.short_name,
        },
        {
          onSuccess: () => {
            setOpen(false);
          },
        }
      );
    },
  });

  // Reset form when dialog opens with current values
  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const handleCancel = () => {
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Actualiza tu nombre y nombre corto. Los cambios se guardarán
            inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <MutationStatusHandler mutations={[updateProfileMutation]}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="space-y-4 py-4"
          >
            {/* Name Field */}
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label="Nombre"
                  schema={profileEditSchema}
                  inputProps={{
                    placeholder: "Ingresa tu nombre completo",
                    maxLength: 100,
                  }}
                />
              )}
            </form.AppField>

            {/* Short Name Field */}
            <form.AppField name="short_name">
              {(field) => (
                <field.TextField
                  label="Nombre Corto"
                  schema={profileEditSchema}
                  inputProps={{
                    placeholder: "Ingresa tu nombre corto (opcional)",
                    maxLength: 50,
                  }}
                />
              )}
            </form.AppField>

            <form.AppForm>
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateProfileMutation.isPending}
                >
                  Cancelar
                </Button>
                <form.SubscribeButton label="Guardar cambios" />
              </DialogFooter>
            </form.AppForm>
          </form>
        </MutationStatusHandler>
      </DialogContent>
    </Dialog>
  );
}
