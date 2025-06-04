# Guía para Agentes y Contribuidores

## Configuración del Entorno de Desarrollo

- Usa `pnpm dev --turbo` para iniciar el servidor de desarrollo con Turbo para máximo rendimiento.
- Ejecuta `pnpm install` para instalar todas las dependencias del workspace.
- Usa `pnpm format` para formatear el código con Biome antes de hacer commits.
- Verifica que Node.js esté en versión compatible con Next.js 15 (Node 18.17+).
- Configura las variables de entorno necesarias siguiendo el patrón `NEXT_PUBLIC_` para variables del cliente.

## Estructura del Proyecto

- **App Router**: Sigue el patrón de Next.js 15 con App Router en `/app`
- **Componentes**: Organizados en `/components` con co-localización de código relacionado
- **Hooks**: Custom hooks en `/hooks` siguiendo el patrón `use*`
- **Librerías**: Utilidades y configuraciones en `/lib`
- **Base de datos**: Configuración Drizzle ORM en `/lib/db`
- **Contextos**: Providers de React en `/context`
- **Pruebas**: Tests e2e con Playwright en `/tests`

## Scripts de Base de Datos

- Ejecuta `pnpm db:generate` para generar migraciones de Drizzle
- Usa `pnpm db:migrate` para aplicar migraciones a la base de datos
- Ejecuta `pnpm db:studio` para abrir Drizzle Studio y explorar la BD
- Usa `pnpm db:push` para sincronizar el schema sin migraciones
- Ejecuta `pnpm db:pull` para extraer el schema desde la base de datos existente

## Instrucciones de Testing

- Encuentra el plan de CI en la carpeta `.github/workflows`.
- Ejecuta `pnpm test` para correr todas las pruebas de Playwright.
- Las pruebas deben pasar antes de hacer merge a la rama principal.
- Para ejecutar pruebas específicas, usa: `pnpm exec playwright test --grep "<nombre del test>"`.
- Usa `data-testid="component-name"` para selectores de pruebas.
- Mantén cobertura de código superior al 80%.
- Agrega o actualiza pruebas para el código que cambies, incluso si nadie lo pidió.

## Linting y Formateo

- Usa `pnpm lint` para ejecutar ESLint y Biome en modo verificación.
- Ejecuta `pnpm lint:fix` para corregir automáticamente errores de linting.
- Biome es la fuente única de verdad para formateo con estas reglas:
  - `lineWidth: 80`
  - `quoteStyle: 'single'`
  - `semicolons: 'always'`
  - `indentStyle: 'space'` (2 espacios)
- Después de mover archivos o cambiar imports, ejecuta `pnpm lint` para verificar reglas.

## Convenciones de Código

### Nomenclatura
- **Archivos/carpetas**: kebab-case (`user-card.tsx`)
- **Componentes React**: PascalCase (`UserCard`)
- **Variables/funciones**: camelCase (`fetchUser`)
- **Constantes**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT_MS`)
- **Variables de entorno**: Prefijo `NEXT_PUBLIC_` para cliente

### TypeScript
- Usar `strict: true` y `noImplicitAny: true`
- Preferir `type` sobre `interface` para datos simples
- Usar `interface` para props de componentes React
- Documentar funciones exportadas con TSDoc

### Estructura de Archivos
- Seguir el patrón de App Router de Next.js 15
- Agrupar server actions bajo `_actions/` dentro de sus rutas
- Usar aliases de ruta (`@/components/*`) para importaciones
- Co-localizar código relacionado en carpetas autónomas

## Instrucciones para Pull Requests

**Formato del título**: `[scope] descripción`

Ejemplos:
- `[auth] implementar login con GitHub`
- `[ui] agregar componente de chat mejorado`
- `[db] migración para tabla de usuarios`
- `[fix] corregir error de hidratación en SSR`

### Antes de crear el PR:
1. Ejecutar `pnpm lint:fix` para corregir problemas de formato
2. Ejecutar `pnpm test` para verificar que todas las pruebas pasen
3. Verificar que el build funcione con `pnpm build`
4. Revisar que no haya errores de TypeScript

### Ramas:
- `feat/scope` para nuevas funcionalidades
- `fix/scope` para correcciones de bugs
- `refactor/scope` para refactorizaciones
- `test/scope` para mejoras en testing

### Commits:
Usar Conventional Commits + Gitmoji en inglés:
- `✨ feat(auth): implement GitHub login`
- `🐛 fix(ui): resolve hydration error in chat`
- `♻️ refactor(db): optimize user queries`
- `✅ test(api): add integration tests for chat endpoint`

## Rendimiento y Accesibilidad

- Preferir React Server Components para páginas con datos
- Usar `next/image` para imágenes optimizadas
- Asegurar contraste de color mínimo de 4.5:1 (AA)
- Implementar diseño "mobile-first"
- Validar accesibilidad con `@axe-core/react`
- Usar Suspense boundaries para mejor UX de carga

## Herramientas de Desarrollo

- **Biome**: Linting y formateo
- **Playwright**: Testing e2e
- **Drizzle**: ORM y migraciones de BD
- **Next.js 15**: Framework con App Router
- **Tailwind CSS**: Styling con utilidades
- **TypeScript**: Tipado estático
- **pnpm**: Gestor de paquetes

## Recursos Adicionales

- Revisa `JWT_OPTIMIZATION.md` para optimizaciones de autenticación
- Consulta `OAUTH_SETUP.md` para configuración de OAuth
- Explora `/artifacts` para documentación adicional del proyecto 