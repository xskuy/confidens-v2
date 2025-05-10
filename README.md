# Confidens v2

<p align="center">
    Plataforma avanzada de chat y análisis de datos basada en Next.js 15 y la AI SDK que permite construir experiencias de IA conversacional potentes e intuitivas.
</p>

<p align="center">
  <a href="#características"><strong>Características</strong></a> ·
  <a href="#tecnologías"><strong>Tecnologías</strong></a> ·
  <a href="#estructura-del-proyecto"><strong>Estructura</strong></a> ·
  <a href="#instalación-y-desarrollo"><strong>Instalación</strong></a> ·
  <a href="#convenciones-de-desarrollo"><strong>Convenciones</strong></a>
</p>
<br/>

## Características

- **Chat Avanzado** con modelos IA de última generación
  - Conversaciones contextuales con historial persistente
  - Soporte para carga y análisis de archivos
  - Herramientas integradas para análisis de datos 
- **Interfaz Moderna y Responsiva**
  - Diseño accesible y mobile-first
  - Temas claro/oscuro
  - Componentes UI reutilizables con shadcn/ui
- **Arquitectura Robusta**
  - React Server Components (RSCs)
  - Server Actions para operaciones seguras del lado del servidor
  - ORM Drizzle con Supabase para persistencia de datos
- **Flujo de Desarrollo Optimizado**
  - Sistema de tipos estricto con TypeScript
  - Linting y formateo con Biome
  - Pruebas e2e con Playwright

## Tecnologías

### Frontend
- [Next.js 15](https://nextjs.org) con App Router
- [React 19](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com) para estilos
- [Shadcn/ui](https://ui.shadcn.com) para componentes de interfaz
- [NextAuth](https://next-auth.js.org) para autenticación

### Backend
- [Supabase](https://supabase.com) para base de datos
- [Drizzle ORM](https://orm.drizzle.team) para acceso a datos
- [AI SDK](https://sdk.vercel.ai/docs) para integración con modelos de IA

### Herramientas de Desarrollo
- [TypeScript](https://www.typescriptlang.org/) con configuración estricta
- [Biome](https://biomejs.dev) para linting y formateo
- [Playwright](https://playwright.dev) para pruebas e2e
- [pnpm](https://pnpm.io) como gestor de paquetes

## Estructura del Proyecto

```
└─ /
   ├─ app/               # Páginas con rutas y server actions
   │  └─ (auth)/         # Ejemplo de grupo de rutas
   │     ├─ page.tsx     # Componente principal de la ruta
   │     ├─ _actions/    # Server actions para esta ruta
   │     ├─ _data/       # Funciones de carga de datos
   │     └─ _components/ # Componentes co-localizados
   ├─ components/        # UI compartida (diseño atómico)
   ├─ lib/               # Helpers, utils, clientes de API
   ├─ hooks/             # Hooks de React reutilizables
   ├─ tests/             # Pruebas e2e con Playwright
   └─ public/            # Activos estáticos
```

## Instalación y Desarrollo

### Requisitos Previos

- Node.js 20+
- pnpm 9.x

### Variables de Entorno

Copia `.env.example` a `.env.local` y configura las variables necesarias:

```bash
cp .env.example .env.local
```

### Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar la base de datos
pnpm db:migrate

# Iniciar servidor de desarrollo
pnpm dev
```

Tu aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Comandos Útiles

```bash
# Verificar código
pnpm lint

# Formatear código
pnpm format

# Ejecutar pruebas
pnpm test

# Construir para producción
pnpm build
```

## Convenciones de Desarrollo

### Código y Estilo

- Usar **Biome** para formateo y linting
- TypeScript con modo estricto
- Preferir types sobre interfaces para datos simples

### Nomenclatura

- Archivos/carpetas: kebab-case (`user-card.tsx`)
- Componentes React: PascalCase (`UserCard`)
- Variables/funciones: camelCase (`fetchUser`)
- Constantes: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT_MS`)

### Git y Control de Código

- Ramas: `feat/scope`, `fix/scope`, `refactor/scope`
- Commits: Conventional Commits + Gitmoji en inglés
  - Ejemplo: `✨ feat(auth): implement GitHub login`
- PRs pequeños con verificaciones de CI

### Rendimiento y Accesibilidad

- Preferir React Server Components para páginas con datos
- Usar `next/image` para imágenes optimizadas
- Asegurar contraste de color mínimo de 4.5:1 (AA)
- Implementar diseño mobile-first

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.
