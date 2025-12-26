import z from "zod";

export const userCreateSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre del usuario es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  short_name: z
    .string()
    .max(50, "El nombre corto no puede exceder 50 caracteres")
    .optional(),
  role: z.enum(["admin", "player"], {
    message: "Debe seleccionar un rol",
  }),
  url_image: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
});

export type UserCreateFormData = z.infer<typeof userCreateSchema>;
