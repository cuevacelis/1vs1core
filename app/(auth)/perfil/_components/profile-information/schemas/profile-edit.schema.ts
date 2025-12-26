import z from "zod";

export const profileEditSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  short_name: z
    .string()
    .max(50, "El nombre corto no puede exceder 50 caracteres")
    .optional(),
});

export type ProfileEditFormData = z.infer<typeof profileEditSchema>;
