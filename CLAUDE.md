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

- `config.ts`: Connection pooling, query helpers, transaction support
- `types.ts`: TypeScript interfaces matching database tables
- `schema.sql`: Complete PostgreSQL schema with triggers for auto-updating modification dates
- `migrate.ts`: Migration runner script

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
1. `orpc` - Base instance with context
2. `authedOrpc` - Requires authenticated user
3. `adminOrpc` - Requires admin role

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

1. Edit `lib/db/schema.sql` for schema changes
2. Run migration: `npx tsx lib/db/migrate.ts`
3. Update TypeScript types in `lib/db/types.ts` to match schema

## Important Notes

- **Package Installation**: Always use `--legacy-peer-deps` flag due to oRPC version conflicts
- **No ORM**: Database access is intentionally raw SQL - do not introduce ORMs
- **Type Safety**: oRPC provides end-to-end type safety - the `AppRouter` type is the contract
- **Client API Calls**: NEVER use direct API routes (`/api/*`). ALWAYS use the oRPC client (`client.auth.login()`, `client.auth.logout()`, etc.) for type-safe API communication
- **Role Checks**: Admin-only pages should use `adminOrpc` in APIs and verify roles in UI
- **WebSocket Singleton**: The WebSocket server is a singleton - use `getWebSocketServer()` to access it
- **Session Management**: Sessions are cookie-based, not JWT - use `lib/auth/session.ts` helpers
