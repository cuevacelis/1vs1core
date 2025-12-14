import { cookies } from "next/headers";
import type { Role, User } from "../db/types";

const SESSION_COOKIE_NAME = "1v1core_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
  userId: number;
  accessCode: string;
}

export async function createSession(data: SessionData) {
  const sessionData = JSON.stringify(data);
  const encoded = Buffer.from(sessionData).toString("base64");

  (await cookies()).set(SESSION_COOKIE_NAME, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);

  if (!session) {
    return null;
  }

  try {
    const decoded = Buffer.from(session.value, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<
  (User & { roles: Role[] }) | null
> {
  const session = await getSession();

  if (!session) {
    return null;
  }

  // Here we would fetch the user from the database
  // For now, returning null as this would be handled by middleware
  return null;
}
