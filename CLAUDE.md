# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

1v1 Core is a tournament management platform for 1v1 competitive matches with real-time champion selection. Players authenticate via private access codes, select champions within a time limit, and administrators can monitor selections in real-time for broadcasting purposes.

## Development Commands

```bash
# Install dependencies (use --legacy-peer-deps due to oRPC version conflicts)
npm install --legacy-peer-deps

# Run development server (Next.js on port 3000)
npm run dev

# Build for production
npm build

# Lint code
npm run lint

# Database commands
npm run db:migrate  # Run database migrations
npm run db:clean    # Clean database (drop all tables, functions, types)
npm run db:reset    # Clean database and run migrations (full reset)
```

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- **State Management**: TanStack Query (React Query) for server state
- **API Layer**: oRPC for end-to-end type-safe APIs (no REST, no GraphQL)
- **Database**: PostgreSQL (AWS DSQL) - **NO ORM**, raw SQL queries via `pg` library
- **Real-time**: WebSocket server for live champion selection updates
- **Authentication**: Session-based with bcrypt-hashed access codes
- **File Storage**: AWS S3 (bucket: 1v1core-images, region: us-east-1)

### Database Architecture (lib/db/)

**No ORM Philosophy**: This project intentionally avoids ORMs. All database interactions use raw SQL queries through the `pg` library following Next.js Learn patterns.

**Core Files**:
- `config.ts`: Connection pooling, query helpers, transaction support
- `types.ts`: TypeScript interfaces matching database tables
- `migrate.ts`: Migration runner script that executes all SQL files in `migrations/` directory

**Migration Files** (executed in alphabetical order):
- `migrations/001_types.sql`: ENUM type definitions (entity_state, user_state, tournament_state, etc.)
- `migrations/002_tables.sql`: All table definitions (person, users, role, tournament, match, etc.)
- `migrations/003_indexes.sql`: Performance indexes for all tables
- `migrations/004_functions_shared.sql`: Shared utility functions and triggers (modification_date auto-update)
- `migrations/005_functions_auth.sql`: Authentication functions (`fn_auth_generate_access_code`, `fn_auth_verify_access_code`)
- `migrations/006_functions_user.sql`: User management functions (`fn_user_create_with_access_code`)
- `migrations/007_functions_role.sql`: Role management functions (`fn_role_assign_to_user`)
- `migrations/008_seed_data.sql`: Initial/default data (roles, games, module access)

**Key Tables**:
- `users` + `person`: User authentication (access_code_hash) and personal info
- `role` + `role_user`: Role-based access control (admin, player)
- `tournament` + `tournament_participations`: Tournament management
- `match`: 1v1 matches with status flow (pending → active → player1_connected → player2_connected → both_connected → in_selection → locked → completed)
- `champion` + `match_champions`: Champion pool and player selections (includes `is_locked` flag)

### API Architecture (lib/orpc/)

**oRPC Pattern**: End-to-end type safety from database → server → client without code generation.

**Structure**:
- `server.ts`: Base oRPC instance, auth middleware, role-based middleware
- `context.ts`: Request context (contains user + roles)
- `router.ts`: Main router aggregating all sub-routers
- `routers/`: Domain-specific routers (auth, tournaments, matches, champions, games)
- `client.ts`: Type-safe frontend client

**Middleware Chain**:
1. `orpc` - Base instance with context (`AppContext` where `user` can be `null`)
2. `authedOrpc` - Requires authenticated user (refines context to `AuthenticatedContext` where `user` is guaranteed non-null)
3. `adminOrpc` - Requires admin role (also uses `AuthenticatedContext`)

**Type Safety**: When using `authedOrpc` or `adminOrpc`, TypeScript guarantees that `context.user` is never `null`, eliminating the need for non-null assertions (`!`) or additional validation. The middleware performs runtime validation and refines the type accordingly.

**All routers export procedures using these base instances**. The type signature `AppRouter` is exported and imported by the client for full type safety.

### Real-time Architecture (lib/websocket/)

**Singleton WebSocket Server** (`server.ts`):
- Runs on WS_PORT (default 3001)
- Maintains client subscriptions per match ID
- Broadcasts to all clients subscribed to a match (except sender for selections)
- Admin clients receive all updates, player clients only for their match

**Message Types**:
- `subscribe/unsubscribe`: Match subscription management
- `champion_selected`: Player hovering/selecting (real-time preview for broadcast)
- `champion_locked`: Player confirmed selection
- `match_update`: Admin-only match status changes

**Client Hook** (`client.ts`): React hook `useWebSocket` with auto-reconnect logic.

### Authentication & Authorization (lib/auth/)

**Session-based Authentication**:
- Users log in with private access codes (bcrypt hashed in `users.access_code_hash`)
- Session stored in HTTP-only cookie (base64-encoded JSON)
- `session.ts`: Session CRUD operations
- `utils.ts`: Access code hashing and generation

**Authorization Pattern**:
- Route groups enforce auth: `(auth)` requires session, `(not-auth)` is public
- Layout-level checks in `app/(auth)/layout.tsx` redirect if no session
- API-level checks via oRPC middleware (`authedOrpc`, `adminOrpc`)
- Client-side role checks should verify `context.user.roles`

### Route Structure (app/)

**Route Groups** (Next.js 13+ convention):
- `(not-auth)/`: Public pages - login (`/`), about (`/about`)
- `(auth)/`: Protected pages - all require active session
  - `/dashboard` - Player dashboard
  - `/perfil` - User profile
  - `/torneo` - Tournament list and management
  - `/torneo/nuevo` - Create tournament (admin only via role check)
  - `/torneo/[id]` - Tournament details
  - `/torneo/editar/[id]` - Edit tournament (admin only)
  - `/player` - Champion selection interface (real-time)
  - `/admin/match/[id]` - Admin match viewer (real-time broadcast view)

**Layout Hierarchy**:
1. `app/layout.tsx` - Root layout with Providers (TanStack Query)
2. `app/(not-auth)/layout.tsx` - Public nav
3. `app/(auth)/layout.tsx` - Protected nav + session check

### Environment Configuration

Required `.env` variables (see `.env.example`):
- AWS credentials (region: us-east-1, user: 1v1core_admin)
- Database connection (AWS DSQL cluster: fvtlvr7mpwtordfltscxngol2a)
- WebSocket port and public URL
- Session secret for cookie signing
- S3 bucket configuration

## Key Implementation Patterns

### Database Queries
```typescript
// Use the query helper from lib/db/config.ts
import { query } from '@/lib/db/config';

const users = await query<User>(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);
```

### oRPC Procedures

**CRITICAL**: All oRPC procedures MUST follow this pattern for type safety and API documentation:

```typescript
// In lib/orpc/routers/*.ts
export const myRouter = orpc.router({
  myProcedure: authedOrpc  // or adminOrpc for admin-only
    .route({
      method: "POST",  // GET, POST, PATCH, DELETE
      path: "/resource/{id}",
      summary: "Título descriptivo en español",  // MUST be in Spanish
      description: "Descripción detallada en español",  // MUST be in Spanish
      tags: ["resource", "admin"],  // For OpenAPI grouping
    })
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100),
      // ... more fields with validation
    }))
    .output(z.object({
      id: z.number(),
      name: z.string(),
      // ... complete output shape with proper types
      // Use .optional() for optional fields (not .nullable())
      // Use z.enum() for literal unions
      // Use z.array() for arrays
    }))
    .handler(async ({ input, context }) => {
      // context.user is guaranteed by authedOrpc (never null)

      // Use database functions, NOT raw queries when possible
      const result = await query<TypedResult>(
        'SELECT * FROM fn_module_action($1, $2)',
        [input.id, context?.session?.userId]
      );

      // Proper error handling with Spanish messages
      if (result.length === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Recurso no encontrado",
        });
      }

      return result[0];
    }),
});
```

**Required Components**:
1. **`.route()`**: Define HTTP method, path, summary (Spanish), description (Spanish), and tags
2. **`.input()`**: Zod schema for input validation
3. **`.output()`**: Zod schema for output validation (CRITICAL for type safety)
4. **`.handler()`**: Implementation logic

**Type Safety Rules**:
- Input types are automatically inferred from `.input()` schema
- Output types MUST match `.output()` schema exactly
- **CRITICAL - `.nullable()` vs `.optional()` in Output Schemas**:
  - **Use `.nullable()`** when PostgreSQL returns `null` for a field (e.g., `short_name: z.string().nullable()`)
    - PostgreSQL ALWAYS includes all fields in JSON responses, even when they have no value (returns `null`)
    - `.nullable()` means: `string | null` (field exists but value can be null)
  - **Use `.optional()`** ONLY when the field might not exist in the response object
    - `.optional()` means: `string | undefined` (field may not be present)
    - This is RARE in database responses since PostgreSQL returns all fields
  - **Common Pattern**: Most database fields that can be NULL should use `.nullable()` NOT `.optional()`
  - **Example (CORRECT)**:
    ```typescript
    .output(z.object({
      id: z.number(),
      name: z.string(),
      short_name: z.string().nullable(),     // ✅ DB returns null
      url_image: z.string().nullable(),       // ✅ DB returns null
      description: z.string().nullable(),     // ✅ DB returns null
    }))
    ```
  - **Example (WRONG)**:
    ```typescript
    .output(z.object({
      id: z.number(),
      name: z.string(),
      short_name: z.string().optional(),     // ❌ DB returns null, not undefined
      url_image: z.string().optional(),       // ❌ Will cause validation errors
    }))
    ```
- TypeScript type definitions MUST match Zod schemas exactly:
  - `.nullable()` in Zod → `string | null` in TypeScript (NOT `string?`)
  - `.optional()` in Zod → `string?` in TypeScript (field may not exist)
- Use `z.date()` for Date objects, `z.string()` for ISO date strings from PostgreSQL
- Database query result types should match output schema structure exactly

**Error Messages**: ALL error messages MUST be in Spanish
```typescript
throw new ORPCError("NOT_FOUND", { message: "Usuario no encontrado" });
throw new ORPCError("BAD_REQUEST", { message: "Datos inválidos" });
throw new ORPCError("FORBIDDEN", { message: "Acceso denegado" });
throw new ORPCError("UNAUTHORIZED", { message: "No autorizado" });
```

### Client-side oRPC Usage
```typescript
// NEVER use direct API routes like /api/auth/login or /api/auth/logout
// ALWAYS use the oRPC client for type-safe API calls

import { client } from '@/lib/orpc/orpc.client';
import { useRouter } from 'next/navigation';

// Login example
const handleLogin = async () => {
  const data = await client.auth.login({ accessCode });
  router.push("/dashboard");
  router.refresh();
};

// Logout example
const handleLogout = async () => {
  await client.auth.logout();
  router.push("/");
  router.refresh();
};

// Any other API call
const tournaments = await client.tournaments.list();
```

### Real-time Updates
```typescript
// Client component
const { subscribe, sendChampionSelected } = useWebSocket(wsUrl);

useEffect(() => {
  subscribe(matchId, userId, isAdmin);
}, [matchId]);

// Broadcast selection
sendChampionSelected(matchId, playerId, championId, { championName });
```

### Match State Flow

Critical status transitions in `match.status`:
1. **pending**: Match created, not activated
2. **active**: Admin activated, waiting for players
3. **player1_connected** / **player2_connected**: One player connected
4. **both_connected**: Both players connected, ready for selection
5. **in_selection**: At least one player selecting champion
6. **locked**: Both players locked selections
7. **completed**: Match finished, winner recorded

Handle these transitions in match-related procedures and WebSocket messages.

## AWS Resources

- **IAM User**: 1v1core_admin (needs permissions for DSQL, S3)
- **DSQL Cluster**: fvtlvr7mpwtordfltscxngol2a (us-east-1)
- **S3 Bucket**: 1v1core-images (us-east-1)

## Database Migration Workflow

### Running Migrations

To apply all database changes, run:
```bash
npm run db:migrate
# or
npx tsx lib/db/migrate.ts
```

This will execute all SQL files in `lib/db/migrations/` in alphabetical order (001, 002, 003, etc.).

### Adding New Migrations

When making database changes, add new migration files following this workflow:

1. **Create a new migration file** in `lib/db/migrations/` with the next sequence number:
   - Use format: `XXX_description.sql` where XXX is a 3-digit number
   - Examples: `009_add_notifications_table.sql`, `010_add_email_column.sql`

2. **Choose the appropriate category** based on your change:
   - **Types**: New ENUM types → `00X_types_*.sql`
   - **Tables**: New tables or table modifications → `00X_tables_*.sql`
   - **Indexes**: New indexes → `00X_indexes_*.sql`
   - **Functions**: New/updated functions → `00X_functions_*.sql`
   - **Data**: Seed/default data → `00X_seed_*.sql`

3. **Write idempotent SQL**:
   - Use `CREATE TABLE IF NOT EXISTS`
   - Use `CREATE INDEX IF NOT EXISTS`
   - Use `CREATE OR REPLACE FUNCTION` for functions
   - Use `INSERT ... ON CONFLICT DO NOTHING` for seed data
   - For ENUM types, use `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
   - For functions with return type changes, use `DROP FUNCTION IF EXISTS` before creating

4. **Update TypeScript types** in `lib/db/types.ts` to match schema changes

5. **Test the migration**:
   ```bash
   npm run db:migrate
   ```

### Example: Adding a New Table

Create `lib/db/migrations/009_add_notifications_table.sql`:

```sql
-- ============================================================================
-- 009_add_notifications_table.sql
-- Notifications System
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    state entity_state DEFAULT 'active',
    creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_user ON notification(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_read ON notification(is_read);
```

Then run `npm run db:migrate` to apply the changes.

### Modifying Existing Migrations

**IMPORTANT**:
- ✅ **DO** modify existing migration files if they haven't been deployed to production yet
- ❌ **DO NOT** modify existing migration files that have been deployed to production
- For production changes, always create a new migration file (e.g., `00X_alter_*.sql`)

### Database Function Naming Convention

**CRITICAL**: All PostgreSQL functions MUST follow this naming pattern:

**Pattern**: `fn_[module]_[functionality]`

Where:
- `fn_` - Fixed prefix for all database functions
- `[module]` - The module/domain the function affects (e.g., `user`, `auth`, `role`, `tournament`, `match`, `shared`)
- `[functionality]` - Brief description of what the function does (e.g., `create_with_access_code`, `generate_access_code`, `assign_to_user`)

### Database Function Documentation Pattern

**CRITICAL**: All PostgreSQL functions MUST include documentation in Spanish immediately after the `BEGIN` keyword following this exact format:

```sql
CREATE OR REPLACE FUNCTION fn_module_functionality(
    p_param1 TYPE,
    p_param2 TYPE DEFAULT value
)
RETURNS return_type AS $$
DECLARE
    v_variable TYPE;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_module_functionality
      PROPÓSITO: Descripción clara de qué hace la función
      INVOCACIÓN: SELECT * FROM fn_module_functionality(valor1, valor2);
      PARÁMETROS: (opcional - solo si requiere explicación adicional)
        - p_param1: Descripción del parámetro 1
        - p_param2: Descripción del parámetro 2 (default: valor)
      RETORNA: Descripción de lo que retorna con estructura detallada
      VALIDACIONES: (opcional - solo si aplica)
        - Lista de validaciones que realiza la función
        - Condiciones que verifica antes de ejecutar
      NOTAS: (opcional - información adicional relevante)
        - Comportamientos especiales
        - Consideraciones de seguridad
        - Patrones de uso recomendados
    ******************************************************************************/
    -- Function implementation
    ...
END;
$$ LANGUAGE plpgsql;
```

**Reglas de Documentación**:
1. **NOMBRE**: Siempre debe coincidir con el nombre de la función
2. **PROPÓSITO**: Descripción en español de qué hace la función (una línea clara)
3. **INVOCACIÓN**: Ejemplo completo de cómo llamar la función con valores reales
4. **PARÁMETROS**: (Opcional) Solo incluir si los parámetros requieren explicación adicional más allá del nombre
5. **RETORNA**: Descripción de lo que retorna, incluyendo estructura si es JSONB o TABLE
6. **VALIDACIONES**: (Opcional) Lista de validaciones que la función realiza
7. **NOTAS**: (Opcional) Información adicional importante (seguridad, triggers, comportamientos especiales)
8. **Mensajes de Error**: Todos los mensajes de error/éxito deben estar en español

**Ejemplo 1: Función Simple**:

```sql
-- Authentication module
CREATE OR REPLACE FUNCTION fn_auth_generate_access_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_auth_generate_access_code
      PROPÓSITO: Función para generar un código de acceso aleatorio de 12 caracteres alfanuméricos
      INVOCACIÓN: SELECT fn_auth_generate_access_code();
      RETORNA: TEXT - Código de acceso aleatorio (ej: 'A3K9M2P7Q1R5')
      NOTAS:
        - Utiliza solo letras mayúsculas (A-Z) y números (0-9)
        - Longitud fija de 12 caracteres
        - No verifica unicidad (debe hacerse externamente)
    ******************************************************************************/
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

**Ejemplo 2: Función con Validaciones y Parámetros**:

```sql
-- Tournament module
CREATE OR REPLACE FUNCTION fn_tournament_join(
    p_tournament_id INTEGER,
    p_user_id INTEGER
)
RETURNS TABLE(
    out_success BOOLEAN,
    out_message TEXT,
    out_participation JSONB
) AS $$
DECLARE
    v_tournament tournament%ROWTYPE;
    v_participants_count INTEGER;
BEGIN
    /******************************************************************************
      NOMBRE:  fn_tournament_join
      PROPÓSITO: Función para inscribir un usuario en un torneo, validando disponibilidad y cupos
      INVOCACIÓN: SELECT * FROM fn_tournament_join(1, 5);
      RETORNA: Éxito, mensaje descriptivo y datos de la participación en JSONB
      VALIDACIONES:
        - Verifica que el torneo exista
        - Verifica que el torneo esté activo y aceptando participantes
        - Verifica que el usuario no esté ya inscrito
        - Verifica que haya cupos disponibles (si hay límite de participantes)
    ******************************************************************************/
    -- Get tournament
    SELECT * INTO v_tournament FROM tournament WHERE id = p_tournament_id;

    -- Check if tournament exists
    IF v_tournament.id IS NULL THEN
        RETURN QUERY SELECT false, 'Torneo no encontrado', NULL::JSONB;
        RETURN;
    END IF;

    -- Implementation continues...
END;
$$ LANGUAGE plpgsql;
```

**Ejemplo 3: Función Trigger**:

```sql
-- Shared/utility module
CREATE OR REPLACE FUNCTION fn_shared_update_modification_date()
RETURNS TRIGGER AS $$
BEGIN
    /******************************************************************************
      NOMBRE:  fn_shared_update_modification_date
      PROPÓSITO: Función trigger para actualizar automáticamente el campo modification_date cuando se modifica un registro
      INVOCACIÓN: Se ejecuta automáticamente mediante triggers en las tablas configuradas
      RETORNA: NEW record con modification_date actualizado al timestamp actual
      NOTAS:
        - Esta es una función de tipo TRIGGER, no se invoca directamente
        - Se ejecuta automáticamente BEFORE UPDATE en las tablas configuradas
        - Garantiza que modification_date siempre refleje la última modificación
    ******************************************************************************/
    NEW.modification_date = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Module Guidelines**:
- `auth` - Authentication and access code operations
- `user` - User CRUD operations
- `role` - Role management and assignments
- `tournament` - Tournament operations
- `match` - Match operations
- `champion` - Champion operations
- `shared` - Utility functions used across multiple modules (triggers, validators, etc.)

**Benefits**:
- ✅ Clear module ownership
- ✅ Consistent naming across the codebase
- ✅ Easy to search and filter functions by module
- ✅ Self-documenting code
- ✅ Prevents naming conflicts

## TanStack Query Patterns

### Query Hook Organization

**CRITICAL**: Follow Next.js App Router file structure patterns for query hooks:

- **Location**: Place query hooks in `_components/services/` folder at the page level. All hooks for a page should be consolidated in a single services directory.
- **NO Barrel Exports**: Do NOT create `index.ts` files to re-export hooks
- **Colocation**: Each hook should live in the page's `_components/services/` directory
- **Direct Imports**: Import hooks directly from their service files
- **Flexibility**: For very large pages with many distinct sections, you MAY create nested `_components/[section]/services/` folders, but prefer the flat structure at `_components/services/` by default

### Query Hook Structure

**IMPORTANT**: This project uses `@orpc/tanstack-query` for TanStack Query integration. Query keys are automatically managed by oRPC.

Each query hook file MUST follow this pattern:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

interface UseEntityQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
}

/**
 * Query hook to fetch entity data
 * Uses oRPC TanStack Query integration for automatic query key management
 *
 * @param config - Optional query configuration
 * @returns Entity data
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useEntityQuery()
 * ```
 */
export function useEntityQuery(config?: UseEntityQueryConfig) {
  return useQuery(
    orpc.entity.get.queryOptions({
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000, // 30 seconds default
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
```

**CRITICAL**: Pass all options directly to `queryOptions()`, NOT using spread operator.

**For queries with parameters**:

```typescript
export function useEntityDetailQuery(id: number, config?: UseEntityDetailQueryConfig) {
  return useQuery(
    orpc.entity.getById.queryOptions({
      input: { id },
      enabled: config?.enabled ?? !!id,  // Auto-disable if no ID
      staleTime: config?.staleTime ?? 30 * 1000,
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
```

**For queries with optional parameters**:

```typescript
interface TournamentsListParams {
  status?: "active" | "completed";
  limit?: number;
  offset?: number;
}

export function useTournamentsListQuery(
  params?: TournamentsListParams,
  config?: UseTournamentsListQueryConfig,
) {
  return useQuery(
    orpc.tournaments.list.queryOptions({
      input: params || {},
      enabled: config?.enabled,
      staleTime: config?.staleTime ?? 30 * 1000,
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
    }),
  );
}
```

**For real-time queries with polling**:

```typescript
interface UseMatchDetailQueryConfig {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;  // Add polling support
}

export function useMatchDetailQuery(matchId: number, config?: UseMatchDetailQueryConfig) {
  return useQuery(
    orpc.matches.getById.queryOptions({
      input: { id: matchId },
      enabled: config?.enabled ?? !!matchId,
      staleTime: config?.staleTime ?? 10 * 1000,
      gcTime: config?.gcTime,
      refetchOnWindowFocus: config?.refetchOnWindowFocus ?? true,
      refetchInterval: config?.refetchInterval ?? 5000, // Poll every 5 seconds by default
    }),
  );
}
```

**Key Benefits**:
- ✅ No manual query key management
- ✅ Automatic key generation based on procedure path and inputs
- ✅ Built-in invalidation helpers: `queryClient.invalidateQueries({ queryKey: orpc.entity.key() })`
- ✅ SSR support with hydration
- ✅ Type-safe from backend to frontend

### File Naming Convention

Follow TanStack Query naming patterns:

- **List queries**: `use-[entity]-list.query.ts` or `use-[entity].query.ts` (if only one query)
- **Detail queries**: `use-[entity]-detail.query.ts` or `use-[entity]-by-id.query.ts`
- **Special queries**: `use-[entity]-[context].query.ts` (e.g., `use-notes-table.query.ts`)
- **Mutations**: `use-[entity]-create.mutation.ts`, `use-[entity]-update.mutation.ts`, etc.

### Example Directory Structure

**Preferred Pattern** (Consolidated services at page level):

```
app/(auth)/perfil/
├── _components/
│   ├── services/
│   │   ├── use-user-profile.query.ts
│   │   └── use-user-match-statistics.query.ts
│   ├── profile-info/
│   │   └── profile-info.tsx
│   └── statistics/
│       └── statistics.tsx
└── page.tsx
```

**Alternative Pattern** (For very large pages with many sections):

```
app/(auth)/dashboard/
├── _components/
│   ├── header/
│   │   └── services/
│   │       └── use-user-me.query.ts
│   ├── stats-cards/
│   │   └── services/
│   │       └── use-user-stats.query.ts
│   ├── active-match/
│   │   └── services/
│   │       └── use-match-active.query.ts
│   ├── recent-matches/
│   │   └── services/
│   │       └── use-user-recent-matches.query.ts
│   └── my-tournaments/
│       └── services/
│           └── use-user-tournaments.query.ts
└── page.tsx
```

### Import Pattern

**Preferred Pattern** (Consolidated services):

```typescript
// CORRECT - Direct imports from consolidated services folder
import { useUserProfileQuery } from "./_components/services/use-user-profile.query";
import { useUserMatchStatisticsQuery } from "./_components/services/use-user-match-statistics.query";

// WRONG - No barrel exports
import { useUserProfileQuery, useUserMatchStatisticsQuery } from "./_components/services";
```

**Alternative Pattern** (Nested services):

```typescript
// CORRECT - Direct imports from nested service files
import { useMatchActiveQuery } from "./_components/active-match/services/use-match-active.query";
import { useUserMeQuery } from "./_components/header/services/use-user-me.query";

// WRONG - No barrel exports
import { useMatchActiveQuery, useUserMeQuery } from "./_components/queries";
```

### Stale Time Guidelines

Set appropriate stale times based on data volatility:

- **User Profile**: 5 minutes (rarely changes)
- **Statistics**: 30 seconds (moderate updates)
- **Active Match**: 10 seconds (frequent updates needed)
- **Lists/Collections**: 30 seconds (general purpose)

### Mutations with oRPC

**Mutation Hook Pattern**:

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function useCreateTournamentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    ...orpc.tournaments.create.mutationOptions(),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: orpc.tournaments.key() });
    },
  });
}
```

**Usage in components**:

```typescript
const createMutation = useCreateTournamentMutation();

const handleCreate = async () => {
  await createMutation.mutateAsync({ name: "New Tournament" });
};
```

### Server-Side Rendering (SSR) with oRPC

**Server Component (page.tsx)**:

```typescript
import { getQueryClient, HydrateClient } from "@/lib/query/hydration";
import { orpc } from "@/lib/orpc/orpc.client";
import { ClientComponent } from "./_components/client-component";

export default function Page() {
  const queryClient = getQueryClient();

  // Prefetch data on the server
  queryClient.prefetchQuery(
    orpc.users.me.queryOptions()
  );

  return (
    <HydrateClient client={queryClient}>
      <ClientComponent />
    </HydrateClient>
  );
}
```

**Client Component**:

```typescript
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

export function ClientComponent() {
  const { data } = useSuspenseQuery(orpc.users.me.queryOptions());

  return <div>{data.name}</div>;
}
```

### Query Invalidation Patterns

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc/orpc.client";

const queryClient = useQueryClient();

// Invalidate all queries for a router
queryClient.invalidateQueries({ queryKey: orpc.users.key() });

// Invalidate specific procedure
queryClient.invalidateQueries({ queryKey: orpc.users.me.queryKey() });

// Invalidate procedure with specific input
queryClient.invalidateQueries({
  queryKey: orpc.tournaments.getById.queryKey({ input: { id: 123 } })
});
```

### Request Status Handling

**CRITICAL**: All components that use TanStack Query hooks (queries or mutations) MUST use `QueryStatusHandler` or `MutationStatusHandler` to properly handle loading, error, and success states.

**Components Location**: `components/request-status/`

#### QueryStatusHandler

Use `QueryStatusHandler` to wrap content that depends on query results. It handles:
- ✅ Loading states (shows loading spinner)
- ✅ Error states (shows error message)
- ✅ Empty data states (optional)
- ✅ Success state (renders children)

**Configuration Options**:
- `queries` - Array of queries to monitor (required)
- `hideLoadingModal` - Hides the default loading modal (default: false)
- `hideNoDataMessage` - Hides the empty state message (default: false)
- `hideErrorMessage` - Hides error messages (default: false)
- `loadingType` - Type of loading check: "isLoading" or "isFetching" (default: "isFetching")
- `emptyStateComponent` - Custom component to show when there's no data
- `customLoadingComponent` - Custom loading component (replaces default ModalLoading)
- `errorMode` - Error display mode: "block" (full error page) or "partial" (error alert) (default: "partial")

**Pattern**:

```typescript
"use client";

import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { useEntityQuery } from "./_components/services/use-entity.query";

export function MyComponent() {
  const dataQuery = useEntityQuery();

  return (
    <QueryStatusHandler queries={[dataQuery]}>
      {/* This content only renders when query is successful */}
      <div>{dataQuery.data?.name}</div>
    </QueryStatusHandler>
  );
}
```

**Multiple Queries**:

```typescript
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { useUserProfileQuery } from "./_components/services/use-user-profile.query";
import { useUserStatsQuery } from "./_components/services/use-user-stats.query";

export function Dashboard() {
  const profileQuery = useUserProfileQuery();
  const statsQuery = useUserStatsQuery();

  return (
    <QueryStatusHandler queries={[profileQuery, statsQuery]}>
      {/* Only renders when ALL queries are successful */}
      <ProfileInfo data={profileQuery.data} />
      <StatsCards data={statsQuery.data} />
    </QueryStatusHandler>
  );
}
```

**With Table Component**:

```typescript
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { TableCompleteComponent } from "@/components/table";
import { fuzzyFilter } from "@/components/table/utils/fuzzy-filter";
import { useStudentsListQuery } from "./_components/services/use-students-list.query";

const columnHelper = createColumnHelper<Student>();

export function StudentsTable() {
  const studentsQuery = useStudentsListQuery();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "numero",
        header: "N°",
        size: 50,
        cell: ({ row }) => row.index + 1,
      }),
      columnHelper.accessor("name", {
        header: "Nombre",
        size: 300,
      }),
      // ... more columns
    ],
    [],
  );

  return (
    <QueryStatusHandler queries={[studentsQuery]}>
      <TableCompleteComponent
        tableOptions={{
          data: studentsQuery.data ?? [],
          columns,
          getCoreRowModel: getCoreRowModel(),
          getPaginationRowModel: getPaginationRowModel(),
          getSortedRowModel: getSortedRowModel(),
          getFilteredRowModel: getFilteredRowModel(),
          filterFns: {
            fuzzy: fuzzyFilter,
          },
        }}
        search={{
          show: true,
          searchParamKey: "searchStudents",
        }}
        footer={{
          showPagination: true,
        }}
      />
    </QueryStatusHandler>
  );
}
```

**With Custom Loading Component**:

```typescript
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { LoadingMessage } from "@/components/validate/message/loading-message";
import { useEntityQuery } from "./_components/services/use-entity.query";

export function MyComponent() {
  const dataQuery = useEntityQuery();

  return (
    <QueryStatusHandler
      queries={[dataQuery]}
      customLoadingComponent={
        <div className="flex items-center justify-center p-8">
          <LoadingMessage
            modeView="card"
            message="Cargando información personalizada..."
          />
        </div>
      }
    >
      <div>{dataQuery.data?.name}</div>
    </QueryStatusHandler>
  );
}
```

**Custom Loading and Empty State Components**:

**CRITICAL**: When creating components with `QueryStatusHandler`, you MUST create custom loading and empty-state components following this directory structure:

**Directory Structure Pattern**:
```
app/(auth)/[page]/_components/
├── [component-name]/
│   ├── loading/
│   │   └── [component-name]-loading.tsx    # Custom loading component
│   ├── empity-state/                         # Note: "empity-state" (typo is intentional)
│   │   └── [component-name]-empty.tsx       # Custom empty state component
│   ├── services/
│   │   └── use-[entity].query.ts            # Query hooks
│   └── [component-name].tsx                  # Main component
```

**Example Structure**:
```
app/(auth)/perfil/_components/
├── profile-information/
│   ├── loading/
│   │   └── profile-information-loading.tsx
│   ├── empity-state/
│   │   └── profile-information-empty.tsx
│   ├── services/
│   │   └── use-user-profile.query.ts
│   └── profile-information.tsx
├── statistics/
│   ├── loading/
│   │   └── statistics-loading.tsx
│   ├── empity-state/
│   │   └── statistics-empty.tsx
│   ├── services/
│   │   └── use-user-match-statistics.query.ts
│   └── statistics.tsx
└── page.tsx
```

**Loading Component Pattern**:

The loading component should mirror the structure of the main component but with skeleton loaders:

```typescript
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileInformationLoading() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-9 w-64" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
    </Card>
  );
}
```

**Empty State Component Pattern**:

The empty state component should provide helpful messaging when no data is available:

```typescript
import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatisticsEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas</CardTitle>
      </CardHeader>
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-fit p-4 bg-muted/30 rounded-full">
            <Trophy className="h-16 w-16 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              Aún no tienes estadísticas
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Parece que aún no has participado en ninguna partida.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Usage in Main Component**:

```typescript
"use client";

import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { ProfileInformationEmpty } from "./empity-state/profile-information-empty";
import { ProfileInformationLoading } from "./loading/profile-information-loading";
import { useUserProfileQuery } from "./services/use-user-profile.query";

export function ProfileInformation() {
  const profileQuery = useUserProfileQuery();
  const profile = profileQuery.data;

  return (
    <QueryStatusHandler
      queries={[profileQuery]}
      customLoadingComponent={<ProfileInformationLoading />}
      emptyStateComponent={<ProfileInformationEmpty />}
    >
      {/* Main component content */}
      <Card>
        <CardContent>{profile?.name}</CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
```

**Key Rules**:
- ✅ ALWAYS create both `loading/` and `empity-state/` folders for components using `QueryStatusHandler`
- ✅ Loading components should use `<Skeleton />` components to match the layout structure
- ✅ Empty state components should provide helpful messaging with icons
- ✅ File names follow pattern: `[component-name]-loading.tsx` and `[component-name]-empty.tsx`
- ✅ Import paths: `./loading/[component-name]-loading` and `./empity-state/[component-name]-empty`
- 🔴 NEVER use default loading/empty states from `QueryStatusHandler` for production components
- 🔴 NEVER create loading/empty components in the same directory as the main component

#### MutationStatusHandler

Use `MutationStatusHandler` to handle mutation states (create, update, delete operations). It handles:
- ✅ Loading states during mutation
- ✅ Error states with error messages
- ✅ Success states (optional success message)

**IMPORTANT**: `MutationStatusHandler` supports configuration options:
- `hideLoadingModal` - Hides the loading state UI (useful when you show custom loading UI)
- `hideSuccessModal` - Hides the success state UI (useful when you show custom success messages)
- `mutations` - Array of mutations to monitor (use `mutations={[mutation]}` NOT `mutation={mutation}`)

**Placement Rule**: Like `QueryStatusHandler`, `MutationStatusHandler` should be placed OUTSIDE of specific UI elements (forms, cards, etc.) at the component root level. It acts as a global status monitor for mutations.

**Basic Pattern - Simple Form**:

```typescript
"use client";

import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { useCreateTournamentMutation } from "./_components/services/use-tournament-create.mutation";

export function CreateTournamentForm() {
  const createMutation = useCreateTournamentMutation();

  const handleSubmit = async (data: FormData) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div>
      {/* MutationStatusHandler at component root level - NOT inside form */}
      <MutationStatusHandler mutations={[createMutation]} />

      <form onSubmit={handleSubmit}>
        {/* Form fields */}
        <input name="name" />
        <button type="submit" disabled={createMutation.isPending}>
          Crear Torneo
        </button>
      </form>
    </div>
  );
}
```

**Pattern with Admin Action Buttons (Edit/Delete)**:

When implementing admin controls for CRUD operations, follow this pattern:

```typescript
"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Button } from "@/components/ui/button";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useDeleteEntityMutation } from "./services/use-delete-entity.mutation";
import { useUserMeQuery } from "./services/use-user-me.query";

export function EntityDetail({ entityId }: { entityId: number }) {
  const userMeQuery = useUserMeQuery();
  const deleteMutation = useDeleteEntityMutation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const user = userMeQuery.data;
  const isAdmin = user?.roles?.some((role) => role.name === "admin") ?? false;

  return (
    <div>
      {/* MutationStatusHandler at component root level */}
      <MutationStatusHandler mutations={[deleteMutation]} />

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityId={entityId}
      />

      {/* Admin action buttons */}
      {isAdmin && (
        <div className="flex items-center gap-2">
          <Link href={`/entity/${entityId}/editar`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        </div>
      )}

      {/* Rest of component content */}
    </div>
  );
}
```

**Key Points for Admin Actions**:
- ✅ Use `useUserMeQuery()` to get current user data
- ✅ Check `user?.roles?.some((role) => role.name === "admin")` for admin role
- ✅ Edit button: Use `Link` with `variant="outline"` pointing to `/entity/[id]/editar`
- ✅ Delete button: Use `variant="destructive"` that opens a confirmation dialog
- ✅ Icons: `Pencil` for edit, `Trash2` for delete (from `lucide-react`)
- ✅ Keep buttons at `size="sm"` with `gap-2` class for icon spacing
- ✅ Use `MutationStatusHandler` to monitor delete mutation status

**Advanced Pattern - Custom UI with State Checks**:

When you want to show custom loading/success/error messages instead of the default UI from `MutationStatusHandler`, use `hideLoadingModal` and `hideSuccessModal`:

```typescript
"use client";

import { useCallback } from "react";
import { useEffectOnce } from "react-use";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorMessage } from "@/components/validate/message/error-message";
import { LoadingMessage } from "@/components/validate/message/loading-message";
import { SuccessMessage } from "@/components/validate/message/success-message";
import { useSaveDataMutation } from "./_components/services/use-save-data.mutation";

interface SaveModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function SaveModal({ open, setOpen }: SaveModalProps) {
  const saveMutation = useSaveDataMutation();

  const handleSave = useCallback(() => {
    saveMutation.mutate({ data: "example" });
  }, [saveMutation]);

  // Auto-start the mutation when modal opens
  useEffectOnce(() => {
    handleSave();
  });

  const handleChangeOpenModal = (open: boolean) => {
    // Prevent closing while mutation is pending
    if (!open && saveMutation.isPending) {
      setOpen(true);
      return;
    }
    setOpen(open);
  };

  const handleRetry = () => {
    saveMutation.reset();
    handleSave();
  };

  return (
    <Dialog open={open} onOpenChange={handleChangeOpenModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {saveMutation.isPending ? "Guardando datos" : "Guardado de datos"}
          </DialogTitle>
        </DialogHeader>

        <MutationStatusHandler
          mutations={[saveMutation]}
          hideLoadingModal
          hideSuccessModal
        >
          <section className="text-sm overflow-y-auto max-h-96">
            {saveMutation.isPending && (
              <LoadingMessage
                modeView="card"
                message="Espere un momento, se están guardando los datos..."
              />
            )}
            {saveMutation.isSuccess && (
              <SuccessMessage
                modeView="card"
                message="Los datos se guardaron exitosamente"
              />
            )}
            {saveMutation.isError && (
              <ErrorMessage
                modeView="card"
                message={[
                  "Ocurrió un problema con el guardado",
                  "Por favor, verifique la información e intente nuevamente.",
                ]}
              />
            )}
          </section>
        </MutationStatusHandler>

        <DialogFooter>
          {saveMutation.isIdle && (
            <Button onClick={handleSave}>
              Iniciar proceso de guardado
            </Button>
          )}
          {saveMutation.isSuccess && (
            <Button onClick={() => handleChangeOpenModal(false)}>
              Cerrar
            </Button>
          )}
          {saveMutation.isError && (
            <>
              <Button variant="outline" onClick={() => handleChangeOpenModal(false)}>
                Cerrar
              </Button>
              <Button onClick={handleRetry}>Reintentar</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Combined with Query**:

```typescript
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { useEntityQuery } from "./_components/services/use-entity.query";
import { useUpdateEntityMutation } from "./_components/services/use-entity-update.mutation";

export function EditEntityForm({ id }: { id: number }) {
  const entityQuery = useEntityQuery(id);
  const updateMutation = useUpdateEntityMutation();

  const handleSubmit = async (data: FormData) => {
    await updateMutation.mutateAsync({ id, ...data });
  };

  return (
    <QueryStatusHandler queries={[entityQuery]}>
      <form onSubmit={handleSubmit}>
        <MutationStatusHandler mutations={[updateMutation]} />

        {/* Form pre-filled with query data */}
        <input name="name" defaultValue={entityQuery.data?.name} />
        <button type="submit" disabled={updateMutation.isPending}>
          Actualizar
        </button>
      </form>
    </QueryStatusHandler>
  );
}
```

**Multiple Mutations Pattern**:

```typescript
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { useCreateUserMutation } from "./_components/services/use-create-user.mutation";
import { useSendEmailMutation } from "./_components/services/use-send-email.mutation";

export function CreateUserForm() {
  const createUserMutation = useCreateUserMutation();
  const sendEmailMutation = useSendEmailMutation();

  const handleSubmit = async (data: FormData) => {
    const user = await createUserMutation.mutateAsync(data);
    await sendEmailMutation.mutateAsync({ userId: user.id });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Monitor both mutations */}
      <MutationStatusHandler
        mutations={[createUserMutation, sendEmailMutation]}
      />

      <input name="name" />
      <button
        type="submit"
        disabled={createUserMutation.isPending || sendEmailMutation.isPending}
      >
        Crear Usuario
      </button>
    </form>
  );
}
```

#### Complete Example

Full example with dialog, query, and mutation:

```typescript
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";
import { BookOpen, Calendar, Users } from "lucide-react";
import { useMemo } from "react";
import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { TableCompleteComponent } from "@/components/table";
import { fuzzyFilter } from "@/components/table/utils/fuzzy-filter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ICourseStudent } from "../../../_components/services/use-course-student.query";
import { CourseInfoItem } from "../../course-info-item";
import {
  type IFetchListEnrollments,
  useEnrollmentsStudentQuery,
} from "./_components/services/use-enrollments-student.query";

interface EnrolledStudentsModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  course: ICourseStudent | null;
}

const columnHelper =
  createColumnHelper<NonNullable<IFetchListEnrollments["data"]>[number]>();

export function EnrolledStudentsModal({
  open,
  setOpen,
  course,
}: EnrolledStudentsModalProps) {
  const dataEnrollments = useEnrollmentsStudentQuery({
    params: {
      ccurso: Number(course?.ccurso),
    },
    config: {
      enabled: open,
      gcTime: 0,
    },
  });

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "numero",
        header: "N°",
        size: 50,
        cell: ({ row }) => row.index + 1,
      }),
      columnHelper.accessor("dpersona", {
        header: "Estudiante",
        size: 450,
        cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={row.original.url_foto}
                alt={row.original.dpersona}
              />
              <AvatarFallback>
                {row.original.dpersona.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{row.original.dpersona}</span>
          </div>
        ),
      }),
      columnHelper.accessor("dcarrera", {
        header: "Carrera",
        size: 450,
      }),
      columnHelper.accessor("tcorreo_inst", {
        header: "Correo institucional",
        size: 200,
      }),
    ],
    [],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-7xl 2xl:max-w-full">
        <DialogHeader>
          <DialogTitle className="text-xl">Mis compañeros</DialogTitle>
          <DialogDescription className="text-base sr-only">
            Este informe muestra el estado de los alumnos que están matriculados
          </DialogDescription>
          <Separator className="mt-4" />
        </DialogHeader>

        <section className="max-h-[calc(100vh-150px)] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-4">
            <CourseInfoItem
              icon={Users}
              label="Docente"
              value={course?.docente?.map((item) => item.nombre).join(", ")}
            />
            <CourseInfoItem
              icon={BookOpen}
              label="Asignatura"
              value={course?.dcurso}
            />
            <CourseInfoItem
              icon={Calendar}
              label="Grupo"
              value={course?.grupo}
            />
          </div>

          <QueryStatusHandler queries={[dataEnrollments]}>
            <TableCompleteComponent
              tableOptions={{
                data: dataEnrollments.data?.data ?? [],
                columns,
                getRowId: (row) => `${row.dpersona}-${row.scarrera}`,
                getCoreRowModel: getCoreRowModel(),
                getPaginationRowModel: getPaginationRowModel(),
                getSortedRowModel: getSortedRowModel(),
                getFilteredRowModel: getFilteredRowModel(),
                filterFns: {
                  fuzzy: fuzzyFilter,
                },
              }}
              search={{
                show: true,
                searchParamKey: "searchTableEnrolledStudents",
              }}
              footer={{
                showSelectedRows: false,
                showPagination: true,
              }}
            />
          </QueryStatusHandler>
        </section>
      </DialogContent>
    </Dialog>
  );
}
```

**Benefits**:
- ✅ Consistent loading and error handling across the app
- ✅ User-friendly error messages
- ✅ Automatic loading spinners and modals
- ✅ Cleaner component code (no manual `isLoading` checks)
- ✅ Better UX with proper feedback for all states

**Rules**:
- 🔴 NEVER manually check `query.isLoading` or `query.isError` - use `QueryStatusHandler`
- 🔴 NEVER render content without wrapping in status handlers
- 🔴 NEVER use `mutation={mutation}` - ALWAYS use `mutations={[mutation]}`
- 🔴 NEVER place `MutationStatusHandler` inside `<form>` tags - it should be at component root level
- 🟢 ALWAYS use `QueryStatusHandler` for components consuming query data
- 🟢 ALWAYS use `MutationStatusHandler` for components with mutations
- 🟢 ALWAYS place both `QueryStatusHandler` and `MutationStatusHandler` at component root level, OUTSIDE of specific UI elements
- 🟢 Pass ALL dependent queries to `QueryStatusHandler` queries array
- 🟢 Use `hideLoadingModal` and `hideSuccessModal` when implementing custom UI states
- 🟢 For admin CRUD buttons: use `Pencil` icon for edit (variant="outline"), `Trash2` for delete (variant="destructive")

### Self-Contained Components Architecture

**CRITICAL**: Components that consume queries MUST be self-contained and declare their own hooks internally. Page components should NEVER declare query hooks and pass data down as props.

**Anti-Pattern (WRONG)**:

```typescript
// ❌ BAD: Page declares hooks and passes data as props
export default function Profile() {
  const profileQuery = useUserProfileQuery();
  const statsQuery = useUserMatchStatisticsQuery();

  return (
    <div>
      <ProfileInformation
        profile={profileQuery.data}
        stats={statsQuery.data}
      />
      <Statistics stats={statsQuery.data} />
    </div>
  );
}
```

**Correct Pattern (RIGHT)**:

```typescript
// ✅ GOOD: Page is a presentational component
export default function Profile() {
  return (
    <div>
      <ProfileInformation />
      <Statistics />
    </div>
  );
}

// ✅ GOOD: Each component declares its own hooks
export function ProfileInformation() {
  const profileQuery = useUserProfileQuery();
  const statsQuery = useUserMatchStatisticsQuery();

  const profile = profileQuery.data;
  const stats = statsQuery.data;

  // Compute derived values
  const displayName = profile?.person?.first_name
    ? `${profile.person.first_name} ${profile.person.paternal_last_name}`
    : profile?.name || "Default";

  return (
    <QueryStatusHandler queries={[profileQuery, statsQuery]}>
      <Card>
        {/* Use computed values directly in JSX */}
        <CardTitle>{displayName}</CardTitle>
        {/* ... rest of component */}
      </Card>
    </QueryStatusHandler>
  );
}

export function Statistics() {
  const statsQuery = useUserMatchStatisticsQuery();

  const stats = statsQuery.data;
  const totalMatches = stats?.totalMatches || 0;
  const wins = stats?.wins || 0;

  return (
    <QueryStatusHandler queries={[statsQuery]}>
      <Card>
        {/* Use stats directly */}
        <div>{wins} / {totalMatches}</div>
      </Card>
    </QueryStatusHandler>
  );
}
```

**Key Principles**:

1. **Data Colocation**: Query hooks should be declared where the data is used
2. **No Prop Drilling**: Don't pass query data as props from parent to child
3. **Self-Contained**: Each component handles its own data fetching and state management
4. **Single Responsibility**: Components should either fetch data OR compose other components, not both
5. **No Wrapper Components**: Don't create internal wrapper components just to separate logic from JSX
6. **Direct Usage**: Compute derived values and use them directly in JSX within the same component

**Benefits**:
- ✅ **Independence**: Components can be moved/reused without dependencies
- ✅ **Simplicity**: One level of abstraction per component
- ✅ **Maintainability**: Changes are localized to the component
- ✅ **Testability**: Each component can be tested in isolation
- ✅ **Better Performance**: React Query handles caching, multiple calls to same hook are optimized

**Example - Complete Self-Contained Component**:

```typescript
"use client";

import { QueryStatusHandler } from "@/components/request-status/query-status-handler";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserProfileQuery } from "./services/use-user-profile.query";
import { useUserStatsQuery } from "./services/use-user-stats.query";

export function UserDashboard() {
  // Declare hooks internally
  const profileQuery = useUserProfileQuery();
  const statsQuery = useUserStatsQuery();

  // Extract data
  const profile = profileQuery.data;
  const stats = statsQuery.data;

  // Compute derived values
  const displayName = profile?.name || "User";
  const winRate = stats?.totalMatches
    ? (stats.wins / stats.totalMatches * 100).toFixed(1)
    : 0;

  // Handle all states with QueryStatusHandler
  return (
    <QueryStatusHandler queries={[profileQuery, statsQuery]}>
      <Card>
        <CardHeader>
          <CardTitle>{displayName}</CardTitle>
          <Badge>{profile?.role}</Badge>
        </CardHeader>
        <CardContent>
          <div>Win Rate: {winRate}%</div>
          <div>Total Matches: {stats?.totalMatches}</div>
        </CardContent>
      </Card>
    </QueryStatusHandler>
  );
}
```

**Common Mistakes to Avoid**:

```typescript
// ❌ WRONG: Creating unnecessary wrapper component
export function ProfileInformation() {
  const profileQuery = useUserProfileQuery();

  return (
    <QueryStatusHandler queries={[profileQuery]}>
      <ProfileContent profile={profileQuery.data} />  {/* Unnecessary wrapper */}
    </QueryStatusHandler>
  );
}

function ProfileContent({ profile }) {  /* Unnecessary internal component */
  return <Card>{profile?.name}</Card>;
}

// ✅ CORRECT: Single component handles everything
export function ProfileInformation() {
  const profileQuery = useUserProfileQuery();
  const profile = profileQuery.data;

  return (
    <QueryStatusHandler queries={[profileQuery]}>
      <Card>{profile?.name}</Card>
    </QueryStatusHandler>
  );
}
```

```typescript
// ❌ WRONG: Passing UseQueryResult as prop
interface Props {
  profileQuery: UseQueryResult<Profile, Error>;  // Don't do this
}

// ✅ CORRECT: No props, declare hooks internally
export function ProfileInformation() {
  const profileQuery = useUserProfileQuery();  // Declare internally
  // ...
}
```

## Form Components & Field Validation

### Form Field Components (`components/form/`)

This project uses custom form field components that integrate with TanStack Form and Zod schemas for automatic required/optional field indicators.

**Available Form Components**:
- `TextField` - Standard text input field
- `TextAreaField` - Multiline text input
- `SelectField` - Dropdown select field
- `ComboboxField` - Searchable select field
- `CheckboxField` - Checkbox input
- `RadioGroupField` - Radio button group
- And more in `components/form/components/`

### Automatic Required Field Indicators

**CRITICAL**: Form field components automatically add a red asterisk (*) to required fields based on the Zod schema. You MUST NEVER manually add `<span className="text-destructive">*</span>` to labels.

**How it works**:

1. **`useFieldOptionalityCheck` Hook** (`components/form/hooks/use-field-optionality-check.ts`):
   - Automatically inspects the Zod schema to determine if a field is optional
   - Returns `true` if field is optional (using `z.optional()`), `false` if required, `null` if no schema
   - Supports nested object paths and array indices
   - Can hide the indicator when field is disabled (via `hideWhenDisabled` option)

2. **`FormLabelOptionalitySuffix` Component** (`components/form/components/form-label-optionality-suffix.tsx`):
   - Renders the red asterisk (*) for required fields
   - Returns `null` for optional fields or when no schema is provided
   - Used internally by all form field components

3. **Integration in Form Fields**:
   ```typescript
   const isOptional = useFieldOptionalityCheck(fieldName, schema, {
     hideWhenDisabled: true,
     disabled: inputProps?.disabled,
   });

   // In JSX
   <FieldLabel>{label}</FieldLabel>
   <FormLabelOptionalitySuffix isOptional={isOptional} />
   ```

### Form Field Usage Pattern

**Basic Form Field Example**:

```typescript
import { TextField } from "@/components/form/components/text-field";
import { z } from "zod";

// Define Zod schema
const tournamentSchema = z.object({
  name: z.string().min(1), // Required field (no .optional())
  description: z.string().optional(), // Optional field
  maxPlayers: z.number().min(1),
});

// In your form component
<Form schema={tournamentSchema}>
  {/* Red asterisk (*) will be added automatically */}
  <TextField label="Nombre del Torneo" name="name" schema={tournamentSchema} />

  {/* No asterisk (optional field) */}
  <TextField label="Descripción" name="description" schema={tournamentSchema} />

  {/* Red asterisk (*) will be added automatically */}
  <TextField label="Máximo de Jugadores" name="maxPlayers" schema={tournamentSchema} />
</Form>
```

### Form Default Values Pattern

**CRITICAL**: When defining default values for TanStack Form, ALWAYS use `z.input<typeof schema>` to ensure type safety between the schema and default values.

**Pattern**:

```typescript
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

// Define Zod schema
const tournamentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxPlayers: z.number().min(1),
  startDate: z.string(),
});

// Define default values with type inference from schema
const defaultValues: z.input<typeof tournamentSchema> = {
  name: "",
  description: "",
  maxPlayers: 8,
  startDate: new Date().toISOString().split("T")[0],
};

export function CreateTournamentForm() {
  const form = useForm({
    defaultValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: tournamentSchema,
    },
    onSubmit: async ({ value }) => {
      // Handle form submission
      await client.tournaments.create(value);
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      form.handleSubmit();
    }}>
      <TextField label="Nombre" name="name" form={form} schema={tournamentSchema} />
      <TextField label="Descripción" name="description" form={form} schema={tournamentSchema} />
      {/* ... more fields */}
    </form>
  );
}
```

**With Query Data as Default Values**:

When you need to populate default values from query data (e.g., edit forms), use the same pattern:

```typescript
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { useEffect } from "react";

const tournamentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  maxPlayers: z.number().min(1),
});

export function EditTournamentForm({ tournamentId }: { tournamentId: number }) {
  const tournamentQuery = useTournamentDetailQuery(tournamentId);
  const tournament = tournamentQuery.data;

  // Define default values with fallbacks
  const defaultValues: z.input<typeof tournamentSchema> = {
    name: tournament?.name ?? "",
    description: tournament?.description ?? "",
    maxPlayers: tournament?.maxPlayers ?? 8,
  };

  const form = useForm({
    defaultValues,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: tournamentSchema,
    },
    onSubmit: async ({ value }) => {
      await client.tournaments.update({ id: tournamentId, ...value });
    },
  });

  // Reset form when query data changes
  useEffect(() => {
    if (tournament) {
      form.reset();
    }
  }, [tournament, form]);

  return (
    <QueryStatusHandler queries={[tournamentQuery]}>
      <form onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}>
        <TextField label="Nombre" name="name" form={form} schema={tournamentSchema} />
        <TextField label="Descripción" name="description" form={form} schema={tournamentSchema} />
        {/* ... more fields */}
      </form>
    </QueryStatusHandler>
  );
}
```

**Key Benefits**:
- ✅ **Type Safety**: TypeScript enforces that default values match schema structure
- ✅ **Autocomplete**: Get IntelliSense for all schema fields
- ✅ **Error Prevention**: Catch mismatches between schema and default values at compile time
- ✅ **Refactoring Safety**: Schema changes automatically flag outdated default values

**Rules**:
- 🟢 **ALWAYS** use `z.input<typeof schema>` for default values type annotation
- 🟢 **ALWAYS** provide default values for all required fields
- 🟢 **ALWAYS** use nullish coalescing (`??`) when setting defaults from query data
- 🔴 **NEVER** use plain `const defaultValues = { ... }` without type annotation
- 🔴 **NEVER** use `any` or `unknown` for default values type

### TanStack Form Pattern with useAppForm (RECOMMENDED)

**CRITICAL**: This project uses a custom `useAppForm` hook that integrates TanStack Form with type-safe field components. This is the RECOMMENDED pattern for all forms in the application.

**Hook Location**: `components/form/hooks/use-form.ts`

**Pattern Structure**:

1. **Create Schema File** (`schemas/[entity]-[action].schema.ts`):

```typescript
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
```

2. **Form Component Pattern**:

```typescript
"use client";

import { revalidateLogic } from "@tanstack/react-form";
import { useEffect } from "react";
import type { z } from "zod";
import { useAppForm } from "@/components/form/hooks/use-form";
import { MutationStatusHandler } from "@/components/request-status/mutation-status-handler";
import { Button } from "@/components/ui/button";
import { profileEditSchema } from "./schemas/profile-edit.schema";
import { useUpdateProfileMutation } from "./services/use-update-profile.mutation";

export function EditProfileForm({ currentName, currentShortName }) {
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
          short_name: value.short_name || undefined,
        },
        {
          onSuccess: () => {
            // Handle success
          },
        },
      );
    },
  });

  // Reset form when data changes
  useEffect(() => {
    if (currentName) {
      form.reset();
    }
  }, [currentName, form]);

  return (
    <div>
      <MutationStatusHandler mutations={[updateProfileMutation]} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="space-y-4"
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
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <form.SubscribeButton label="Guardar cambios" />
          </div>
        </form.AppForm>
      </form>
    </div>
  );
}
```

**Available Field Components** (via `form.AppField`):
- `field.TextField` - Standard text input
- `field.TextareaField` - Multiline text input
- `field.CheckBoxField` - Checkbox input
- `field.ComboboxSingleSelectionField` - Searchable single-select dropdown
- `field.RadioGroupField` - Radio button group
- `field.CardSelectionField` - Card-based selection

**Available Form Components** (via `form.AppForm`):
- `form.SubscribeButton` - Submit button that automatically disables during submission
- `form.ResetButton` - Reset button that clears form to default values

**Key Benefits**:
- ✅ **Full Type Safety**: Field names are type-checked against schema
- ✅ **Automatic Validation**: Validates on submit, then on change after first submission
- ✅ **Built-in Components**: Access to all form field components via `field.*`
- ✅ **Smart Submit Button**: `SubscribeButton` automatically handles pending state
- ✅ **No Manual Field Wiring**: No need to manually connect `form`, `name`, `schema` props
- ✅ **Required Field Indicators**: Automatic asterisks based on schema (via `useFieldOptionalityCheck`)

**Rules**:
- 🟢 **ALWAYS** use `useAppForm` instead of raw `useForm` from TanStack Form
- 🟢 **ALWAYS** use `validators.onDynamic` with the Zod schema (NOT `validators.onChange`)
- 🟢 **ALWAYS** use `revalidateLogic({ mode: "submit", modeAfterSubmission: "change" })` for validation timing
- 🟢 **ALWAYS** wrap form in `<form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); }}>`
- 🟢 **ALWAYS** use `form.AppField` render prop pattern for fields
- 🟢 **ALWAYS** wrap submit buttons in `<form.AppForm>` wrapper
- 🟢 **ALWAYS** use `form.SubscribeButton` instead of manual submit button (it handles pending state automatically)
- 🔴 **NEVER** use `zodValidator()` adapter - it's not needed with `useAppForm`
- 🔴 **NEVER** manually add `form`, `name`, `schema` props to field components when using `form.AppField`
- 🔴 **NEVER** use `validators.onChange` - use `validators.onDynamic` instead

**Complete Example Reference**: See `app/(auth)/usuario/[id]/editar/page.tsx` for a full working example.

**Anti-Pattern (WRONG)**:

```typescript
// ❌ NEVER manually add asterisks to labels
<TextField
  label={<>Nombre del Torneo <span className="text-destructive">*</span></>}
  name="name"
  schema={tournamentSchema}
/>

// ❌ The component already handles this automatically!
```

**Correct Pattern (RIGHT)**:

```typescript
// ✅ Just pass the label text - asterisk is added automatically
<TextField
  label="Nombre del Torneo"
  name="name"
  schema={tournamentSchema}
/>
```

### Field Optionality Rules

**Zod Schema Definition**:
- **Required Field**: `z.string()` or `z.number()` etc. → Shows red asterisk (*)
- **Optional Field**: `z.string().optional()` → No asterisk
- **Nullable Field**: `z.string().nullable()` → Shows red asterisk (still required to provide value, just can be null)

**Special Cases**:
- If `schema` prop is not provided, no asterisk is shown
- If field is `disabled` and `hideWhenDisabled` is enabled, no asterisk is shown
- For nested fields (e.g., `person.firstName`), the hook automatically resolves the correct Zod path

### Benefits

- ✅ **Consistency**: All forms have uniform required field indicators
- ✅ **Automatic**: No manual management of asterisks needed
- ✅ **Type-Safe**: Based on Zod schema validation rules
- ✅ **DRY**: Single source of truth (Zod schema) for validation and UI
- ✅ **Maintainability**: Change schema, UI updates automatically

### Rules

- 🔴 **NEVER** manually add `<span className="text-destructive">*</span>` to form labels
- 🔴 **NEVER** create custom required indicators for form fields
- 🟢 **ALWAYS** pass the `schema` prop to form field components
- 🟢 **ALWAYS** use plain text for the `label` prop (let the component add the asterisk)
- 🟢 **ALWAYS** use `z.optional()` in Zod schema for truly optional fields

## Important Notes

- **Package Installation**: Always use `--legacy-peer-deps` flag due to oRPC version conflicts
- **No ORM**: Database access is intentionally raw SQL - do not introduce ORMs
- **Type Safety**: oRPC provides end-to-end type safety - the `AppRouter` type is the contract
- **Database Functions**: ALL PostgreSQL functions MUST follow the naming pattern `fn_[module]_[functionality]` (e.g., `fn_user_create_with_access_code`, `fn_auth_generate_access_code`, `fn_role_assign_to_user`)
- **TanStack Query Integration**: This project uses `@orpc/tanstack-query` for automatic query key management. ALWAYS use `orpc.*.*.queryOptions()` instead of manual query keys
- **Client API Calls**: NEVER use direct API routes (`/api/*`). ALWAYS use the oRPC client (`client.auth.login()`, `client.auth.logout()`, etc.) for type-safe API communication
- **oRPC Utilities**: Use `orpc` from `@/lib/orpc/orpc.client` for queries/mutations. Use `client` for direct API calls
- **Role Checks**: Admin-only pages should use `adminOrpc` in APIs and verify roles in UI
- **WebSocket Singleton**: The WebSocket server is a singleton - use `getWebSocketServer()` to access it
- **Session Management**: Sessions are cookie-based, not JWT - use `lib/auth/session.ts` helpers
- **Query Hooks**: MUST follow TanStack Query patterns with `orpc.*.*.queryOptions()` - NO manual query keys, NO barrel exports
- **Status Handlers**: ALL components using TanStack Query hooks MUST use `QueryStatusHandler` (for queries) or `MutationStatusHandler` (for mutations) from `@/components/request-status/` - NEVER manually check `isLoading`, `isError`, or `isPending`
- **Self-Contained Components**: Components MUST declare their own query hooks internally - NEVER pass query data or `UseQueryResult` as props from parent components. Page components should be presentational only.
- **No Wrapper Components**: Don't create internal wrapper components just to separate query logic from JSX - keep everything in a single component for simplicity
- **SSR Support**: Use `getQueryClient()` and `HydrateClient` from `@/lib/query/hydration` for server-side rendering with automatic serialization
- **Form Field Indicators**: NEVER manually add asterisks (*) to form labels - use the automatic `useFieldOptionalityCheck` system that inspects Zod schemas
