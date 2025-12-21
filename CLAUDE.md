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

# Run database migrations
npx tsx lib/db/migrate.ts
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
```typescript
// In lib/orpc/routers/*.ts
export const myRouter = orpc.router({
  myProcedure: authedOrpc  // or adminOrpc for admin-only
    .input(z.object({ ... }))
    .handler(async ({ input, context }) => {
      // context.user is guaranteed by authedOrpc
      // Perform raw SQL queries here
      return result;
    }),
});
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
- **SSR Support**: Use `getQueryClient()` and `HydrateClient` from `@/lib/query/hydration` for server-side rendering with automatic serialization
