# Mejoras en el Tipado de `authedOrpc` y `adminOrpc`

## Problema Anterior

Antes, cuando usabas `authedOrpc` o `adminOrpc`, el tipo de `context.user` seguía siendo `AuthenticatedUser | null`, lo que requería:

```typescript
// ❌ ANTES: Necesitabas usar el operador ! (non-null assertion)
me: authedOrpc.handler(async ({ context }) => {
  const userId = context.user!.id; // user podría ser null según el tipo
  // ...
});
```

Esto era problemático porque:
- TypeScript no garantizaba que `user` existiera
- Tenías que usar `!` (non-null assertion) constantemente
- Era propenso a errores en tiempo de ejecución si olvidabas validar

## Solución Implementada

Ahora, con las mejoras de tipado:

### 1. Nuevos tipos en `context.ts`

```typescript
export type AuthenticatedUser = User & { roles: Role[] };

export interface AppContext {
  user: AuthenticatedUser | null;
}

export interface AuthenticatedContext {
  user: AuthenticatedUser; // ✅ user nunca es null aquí
}
```

### 2. Middleware actualizado en `server.ts`

Los middlewares ahora refina correctamente el tipo del contexto:

```typescript
export const authMiddleware = orpc.middleware(
  async (options, _input, _output) => {
    if (!options.context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Debes iniciar sesión para acceder a este recurso",
      });
    }
    // ✅ Después de la validación, el tipo es AuthenticatedContext
    return options.next({
      context: { user: options.context.user } as AuthenticatedContext,
    });
  },
);
```

### 3. Uso mejorado en routers

Ahora puedes usar `authedOrpc` sin necesidad de aserción:

```typescript
// ✅ AHORA: TypeScript garantiza que user existe
me: authedOrpc.handler(async ({ context }) => {
  const userId = context.user.id; // ✅ No necesitas ! porque user nunca es null
  const userName = context.user.name; // ✅ Autocompletado completo
  const roles = context.user.roles; // ✅ Acceso directo a roles
  // ...
});
```

## Beneficios

1. **Type Safety**: TypeScript garantiza que `user` nunca es `null` en handlers autenticados
2. **Mejor DX**: IntelliSense y autocompletado funcionan correctamente
3. **Menos código**: No necesitas usar `!` o validaciones adicionales
4. **Más seguro**: Imposible olvidar validar la existencia de `user`
5. **Reutilizable**: `AuthenticatedUser` es un tipo que puedes usar en otros lugares

## Ejemplos de uso

### Router básico con authedOrpc

```typescript
export const myRouter = orpc.router({
  getProfile: authedOrpc
    .route({ method: "GET", path: "/profile" })
    .handler(async ({ context }) => {
      // ✅ context.user es AuthenticatedUser (nunca null)
      const user = context.user;

      return {
        id: user.id,
        name: user.name,
        roles: user.roles.map(r => r.name),
      };
    }),
});
```

### Router con adminOrpc

```typescript
export const adminRouter = orpc.router({
  createUser: adminOrpc
    .route({ method: "POST", path: "/users" })
    .input(z.object({ name: z.string() }))
    .handler(async ({ context, input }) => {
      // ✅ context.user existe y tiene rol admin
      console.log(`Admin ${context.user.name} creating user`);
      // ...
    }),
});
```

### Validación de roles específicos

```typescript
export const myRouter = orpc.router({
  someAction: authedOrpc
    .handler(async ({ context }) => {
      // ✅ Puedes verificar roles específicos
      const isAdmin = context.user.roles.some(r => r.name === "admin");

      if (!isAdmin) {
        throw new ORPCError("FORBIDDEN", {
          message: "Se requiere rol de administrador"
        });
      }

      // ...
    }),
});
```

## Migración

Si tienes código existente con `context.user!`, ahora puedes simplemente eliminar el `!`:

```diff
me: authedOrpc.handler(async ({ context }) => {
-  const userId = context.user!.id;
+  const userId = context.user.id;
});
```
