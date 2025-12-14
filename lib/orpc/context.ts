import { getSession } from "@/lib/auth/session";
import { query } from "@/lib/db/config";
import type { Role, User } from "@/lib/db/types";

export interface AppContext {
  user: (User & { roles: Role[] }) | null;
}

/**
 * Creates the context for oRPC procedures
 * This runs on every API request and provides user session data
 */
export async function createContext(): Promise<AppContext> {
  const session = await getSession();

  if (!session) {
    return { user: null };
  }

  try {
    // Fetch user with roles from database
    const userResult = await query<User>(
      `SELECT u.* FROM users u WHERE u.id = $1`,
      [session.userId],
    );

    if (userResult.length === 0) {
      return { user: null };
    }

    const user = userResult[0];

    // Fetch user roles
    const rolesResult = await query<Role>(
      `SELECT r.* FROM role r
       INNER JOIN role_user ru ON r.id = ru.role_id
       WHERE ru.user_id = $1`,
      [session.userId],
    );

    return {
      user: {
        ...user,
        roles: rolesResult,
      },
    };
  } catch (error) {
    console.error("[Context] Error fetching user:", error);
    return { user: null };
  }
}
