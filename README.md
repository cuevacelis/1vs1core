# 1v1 Core

Plataforma de gestión de torneos para competencias 1v1 con selección de campeones en tiempo real.

## Descripción

1v1 Core es una aplicación web diseñada para gestionar torneos competitivos de 1 contra 1. Los jugadores se autentican mediante códigos de acceso privados, seleccionan campeones dentro de un límite de tiempo, y los administradores pueden monitorear las selecciones en tiempo real para propósitos de transmisión.

## Tecnologías

### Frontend
- **Next.js 16** - Framework de React con App Router
- **React 19** - Biblioteca de interfaz de usuario
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utilitarios
- **shadcn/ui** - Componentes de UI
- **TanStack Query** - Gestión de estado del servidor
- **Sonner** - Notificaciones toast

### Backend
- **oRPC** - APIs type-safe end-to-end (sin REST, sin GraphQL)
- **PostgreSQL** - Base de datos (AWS DSQL)
- **WebSocket** - Actualizaciones en tiempo real
- **bcrypt** - Hash de contraseñas

### Infraestructura
- **AWS S3** - Almacenamiento de imágenes
- **AWS DSQL** - Base de datos PostgreSQL serverless

## Características

- Autenticación basada en sesiones con códigos de acceso
- Gestión completa de torneos (CRUD)
- Selección de campeones en tiempo real
- Sistema de roles (Admin, Jugador)
- WebSocket para actualizaciones live
- Interfaz responsive y moderna
- Type-safety completo desde la base de datos hasta el frontend

## Requisitos Previos

- Node.js 18+
- npm o pnpm
- PostgreSQL (o acceso a AWS DSQL)
- Variables de entorno configuradas (ver `.env.example`)

## Instalación

1. Clona el repositorio:
```bash
git clone https://github.com/cuevacelis/1vs1core.git
cd 1vs1core
```

2. Instala las dependencias:
```bash
npm install --legacy-peer-deps
```

3. Configura las variables de entorno:
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de AWS y base de datos.

4. Ejecuta las migraciones de base de datos:
```bash
npx tsx lib/db/migrate.ts
```

## Ejecución

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Producción

```bash
npm run build
npm start
```

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Biome
- `npx tsx lib/db/migrate.ts` - Ejecuta migraciones de base de datos

## Estructura del Proyecto

```
1v1core/
├── app/                      # App Router de Next.js
│   ├── (auth)/              # Rutas protegidas
│   │   ├── dashboard/       # Dashboard del jugador
│   │   ├── perfil/          # Perfil de usuario
│   │   ├── torneo/          # Gestión de torneos
│   │   ├── player/          # Selección de campeones
│   │   └── admin/           # Panel de administración
│   └── (not-auth)/          # Rutas públicas
├── components/              # Componentes reutilizables
│   └── ui/                  # Componentes de shadcn/ui
├── lib/
│   ├── auth/               # Autenticación y sesiones
│   ├── db/                 # Configuración y tipos de BD
│   ├── orpc/               # Routers y cliente oRPC
│   ├── query/              # Configuración de TanStack Query
│   └── websocket/          # Servidor WebSocket
└── hooks/                  # React hooks personalizados
```

## Arquitectura

- **Sin ORM**: Todas las consultas a la base de datos usan SQL raw a través de la librería `pg`
- **Type-safe APIs**: oRPC proporciona type-safety completo sin generación de código
- **Real-time**: WebSocket singleton para actualizaciones en vivo
- **Server Components**: Uso de React Server Components cuando es posible
- **Client State**: TanStack Query para caché y sincronización

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto es privado y de uso interno.

## Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio de GitHub.
