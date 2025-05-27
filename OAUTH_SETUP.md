# Configuración OAuth - Google y Microsoft

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```bash
# NextAuth
AUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret

# Microsoft Azure AD OAuth
AZURE_AD_CLIENT_ID=tu_azure_client_id
AZURE_AD_CLIENT_SECRET=tu_azure_client_secret
```

## Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Ve a "Credenciales" > "Crear credenciales" > "ID de cliente OAuth 2.0"
5. Configura las URLs de redirección:
   - Desarrollo: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://tudominio.com/api/auth/callback/google`
6. Copia el Client ID y Client Secret

## Configuración de Microsoft Azure AD

1. Ve a [Azure Portal](https://portal.azure.com/)
2. Busca "Microsoft Entra ID" (anteriormente Azure AD)
3. Ve a "App registrations" > "New registration"
4. Configura:
   - Name: Tu aplicación
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: 
     - Desarrollo: `http://localhost:3000/api/auth/callback/azure-ad`
     - Producción: `https://tudominio.com/api/auth/callback/azure-ad`
5. Después de crear:
   - Copia el "Application (client) ID"
   - Ve a "Certificates & secrets" > "New client secret"
   - Copia el valor del secret
   - Para TENANT_ID usa "common" para permitir cuentas personales y organizacionales

## Migración de Base de Datos

Ejecuta las migraciones para crear las tablas necesarias para OAuth:

```bash
pnpm db:generate
pnpm db:migrate
```

## Funcionalidades Implementadas

✅ **Autenticación con Google**
- Obtiene: email, nombre, foto de perfil
- Guarda en base de datos automáticamente

✅ **Autenticación con Microsoft**
- Obtiene: email, nombre, foto de perfil  
- Guarda en base de datos automáticamente

✅ **Adaptador de Base de Datos**
- Integración completa con Drizzle ORM
- Manejo de sesiones y cuentas OAuth
- Tokens de verificación

✅ **Interfaz de Usuario**
- Botones de login actualizados
- Redirección automática después del login
- Manejo de errores

## Estructura de Base de Datos

Las siguientes tablas se han agregado/modificado:

- `User`: Campos adicionales para OAuth (image, provider, providerId)
- `Account`: Información de cuentas OAuth
- `Session`: Sesiones de usuario
- `VerificationToken`: Tokens de verificación

## Próximos Pasos

1. Configura las variables de entorno
2. Ejecuta las migraciones de base de datos
3. Configura los providers en Google y Microsoft
4. Prueba el login en desarrollo
5. Configura las URLs de producción cuando despliegues 