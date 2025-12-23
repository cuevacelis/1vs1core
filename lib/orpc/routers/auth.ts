import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { createSession, destroySession } from "../../auth/session";
import { query } from "../../db/config";
import type { RoleJsonb, User, UserJsonb } from "../../db/types";
import { authedMiddleware } from "../middlewares/auth";
import { basedMiddleware } from "../middlewares/base";

// Schemas reutilizables
const userStateEnum = z.enum([
  "active",
  "suspended",
  "banned",
  "pending_verification",
]);

const roleOutputSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
});

const loginOutputSchema = z.object({
  user: z.object({
    id: z.number(),
    name: z.string(),
    short_name: z.string().optional(),
    state: userStateEnum,
    url_image: z.string().optional(),
    creation_date: z.string(),
    modification_date: z.string().optional(),
    persona_id: z.number().optional(),
    access_code_hash: z.string(),
    role: roleOutputSchema,
  }),
  accessCode: z.string(),
});

const logoutOutputSchema = z.object({
  success: z.boolean(),
});

const meOutputSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    short_name: z.string().optional(),
    state: userStateEnum,
    url_image: z.string().optional(),
    creation_date: z.string(),
    modification_date: z.string().optional(),
    persona_id: z.number().optional(),
    role: roleOutputSchema,
  })
  .nullable();

export const authRouter = {
  login: basedMiddleware
    .route({
      method: "POST",
      path: "/auth/login",
      summary: "Iniciar sesión",
      description: "Autenticar usuario mediante código de acceso",
      tags: ["auth"],
    })
    .input(
      z.object({
        accessCode: z.string().min(1, "El código de acceso es requerido"),
      }),
    )
    .output(loginOutputSchema)
    .handler(async ({ input }) => {
      const { accessCode } = input;
      const result = await query<{
        out_user_id: number;
        out_user_data: UserJsonb; // JSONB type - dates are strings
        out_role: RoleJsonb; // JSONB type - dates are strings
      }>("SELECT * FROM fn_auth_verify_access_code($1)", [accessCode]);

      if (result.length === 0) {
        throw new ORPCError("UNAUTHORIZED", {
          message: "Código de acceso inválido",
        });
      }

      const { out_user_data: user_data, out_role: role } = result[0];

      // Create session
      await createSession({
        userId: user_data.id,
        accessCode,
      });

      return {
        user: {
          id: user_data.id,
          name: user_data.name,
          short_name: user_data.short_name || undefined,
          state: user_data.state,
          url_image: user_data.url_image || undefined,
          creation_date: user_data.creation_date, // Already ISO string from JSONB
          modification_date: user_data.modification_date || undefined,
          persona_id: user_data.persona_id || undefined,
          access_code_hash: user_data.access_code_hash,
          role: {
            id: role.id,
            name: role.name,
            description: role.description || undefined,
          },
        },
        accessCode,
      };
    }),

  logout: basedMiddleware
    .route({
      method: "POST",
      path: "/auth/logout",
      summary: "Cerrar sesión",
      description: "Cerrar la sesión del usuario actual",
      tags: ["auth"],
    })
    .output(logoutOutputSchema)
    .handler(async () => {
      await destroySession();
      return { success: true };
    }),

  me: authedMiddleware
    .route({
      method: "GET",
      path: "/auth/me",
      summary: "Obtener usuario actual",
      description:
        "Obtener información completa del usuario autenticado actualmente",
      tags: ["auth"],
    })
    .output(meOutputSchema)
    .handler(async ({ context }) => {
      if (!context?.session) {
        return null;
      }

      // Query user data from database with role
      const result = await query<{
        id: number;
        name: string;
        short_name: string | null;
        state: User["state"];
        url_image: string | null;
        creation_date: Date;
        modification_date: Date | null;
        persona_id: number | null;
        role_id: number;
        role_name: string;
        role_description: string | null;
      }>(
        `SELECT
          u.id,
          u.name,
          u.short_name,
          u.state,
          u.url_image,
          u.creation_date,
          u.modification_date,
          u.persona_id,
          u.role_id,
          r.name as role_name,
          r.description as role_description
        FROM users u
        INNER JOIN role r ON u.role_id = r.id
        WHERE u.id = $1 AND u.state = 'active'`,
        [context.session.userId],
      );

      if (result.length === 0) {
        return null;
      }

      const user = result[0];

      return {
        id: user.id,
        name: user.name,
        short_name: user.short_name || undefined,
        state: user.state,
        url_image: user.url_image || undefined,
        creation_date: user.creation_date.toISOString(),
        modification_date: user.modification_date?.toISOString(),
        persona_id: user.persona_id || undefined,
        role: {
          id: user.role_id,
          name: user.role_name,
          description: user.role_description || undefined,
        },
      };
    }),
};
