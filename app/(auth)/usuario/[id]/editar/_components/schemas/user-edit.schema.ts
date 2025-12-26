import z from "zod";

export const userEditSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del usuario es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  short_name: z
    .string()
    .max(50, "El nombre corto no puede exceder 50 caracteres")
    .optional(),
  state: z.enum(["active", "suspended", "banned", "pending_verification"], {
    message: "Debe seleccionar un estado",
  }),
  url_image: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

export type UserEditFormData = z.infer<typeof userEditSchema>;
