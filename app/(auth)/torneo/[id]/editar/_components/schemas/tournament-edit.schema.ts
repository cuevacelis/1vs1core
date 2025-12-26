import z from "zod";

export const tournamentEditSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre del torneo es requerido")
      .max(200, "El nombre no puede exceder 200 caracteres"),
    description: z.string().optional(),
    game_id: z
      .string()
      .min(1, "Debe seleccionar un juego")
      .refine((val) => !Number.isNaN(Number.parseInt(val, 10)), {
        message: "Debe seleccionar un juego válido",
      }),
    state: z.enum(["draft", "active", "in_progress", "completed", "cancelled"]),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    max_participants: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          (!Number.isNaN(Number.parseInt(val, 10)) &&
            Number.parseInt(val, 10) >= 2),
        {
          message: "El número de participantes debe ser al menos 2",
        },
      ),
  })
  .refine(
    (data) => {
      // Validar que end_date sea posterior a start_date si ambos existen
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) >= new Date(data.start_date);
      }
      return true;
    },
    {
      message:
        "La fecha de finalización debe ser posterior o igual a la fecha de inicio",
      path: ["end_date"],
    },
  );

export type TournamentEditFormData = z.infer<typeof tournamentEditSchema>;
