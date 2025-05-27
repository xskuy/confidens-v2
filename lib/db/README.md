# 📊 Queries de Base de Datos

Este directorio contiene todas las queries y operaciones de base de datos para el proyecto.

## 🏗️ Estructura

- `schema.ts` - Definiciones de tablas y tipos
- `queries.ts` - Queries principales para todas las entidades
- `utils.ts` - Utilidades de conexión y helpers
- `migrate.ts` - Script de migración
- `migrations/` - Archivos de migración SQL

## 🔧 Configuración

Asegúrate de tener configurada la variable de entorno:

```bash
POSTGRES_URL="postgresql://username:password@localhost:5432/database_name"
```

## 📋 Entidades Principales

### 👥 Organization

- `createOrganization()` - Crear nueva organización
- `getOrganizationById()` - Obtener organización por ID
- `updateOrganization()` - Actualizar organización
- `deleteOrganization()` - Eliminar organización
- `getAllOrganizations()` - Listar todas las organizaciones activas

### 🔐 Role

- `createRole()` - Crear nuevo rol
- `getRoleById()` - Obtener rol por ID
- `updateRole()` - Actualizar rol
- `deleteRole()` - Eliminar rol
- `getAllRoles()` - Listar todos los roles

### 🔌 Integration

- `createIntegration()` - Crear nueva integración
- `getIntegrationById()` - Obtener integración por ID
- `getIntegrationsByOrganizationId()` - Obtener integraciones de una organización
- `updateIntegration()` - Actualizar integración
- `deleteIntegration()` - Eliminar integración

### 👤 User (extendido)

- `createUser()` - Crear usuario con organización y rol
- `getUserWithOrganizationAndRole()` - Obtener usuario con relaciones
- `getUsersByOrganizationId()` - Obtener usuarios de una organización

## 🧪 Pruebas

### Ejecutar pruebas de queries existentes:

```bash
pnpm test:queries
```

### Ejecutar pruebas de nuevas queries:

```bash
pnpm test:new-queries
```

## 🚀 Migraciones

### Generar nueva migración:

```bash
pnpm db:generate
```

### Ejecutar migraciones:

```bash
pnpm db:migrate
```

### Ver estado de la base de datos:

```bash
pnpm db:studio
```

## 📝 Ejemplos de Uso

### Crear una organización completa:

```typescript
import { createOrganization, createRole, createUser } from "./queries";

// 1. Crear organización
const org = await createOrganization({
  name: "Mi Empresa",
  description: "Descripción de la empresa",
  planType: "premium",
});

// 2. Crear rol
const adminRole = await createRole({
  name: "Admin",
  description: "Administrador",
  permissions: {
    canManageUsers: true,
    canManageOrganization: true,
  },
});

// 3. Crear usuario
const user = await createUser({
  email: "admin@empresa.com",
  password: "password123",
  firstName: "Juan",
  lastName: "Pérez",
  organizationId: org.id,
  roleId: adminRole.id,
});
```

### Obtener usuario con relaciones:

```typescript
const userWithData = await getUserWithOrganizationAndRole("admin@empresa.com");
console.log({
  user: userWithData?.email,
  organization: userWithData?.organization?.name,
  role: userWithData?.role?.name,
  permissions: userWithData?.role?.permissions,
});
```

## 🔒 Seguridad

- Todas las queries incluyen manejo de errores
- Los passwords se hashean automáticamente
- Las relaciones se validan con foreign keys
- Los campos sensibles están protegidos

## 📊 Tipos TypeScript

Todos los tipos están exportados desde `schema.ts`:

- `Organization`
- `Role`
- `Integration`
- `User`
- `Chat`
- `DBMessage`
- `Vote`
- `Document`
- `Suggestion`
