# Optimización de JWT y Sesiones

## Cambios Realizados

### 1. Sesión del Servidor en Layout
- Se obtiene la sesión una sola vez en `app/layout.tsx` usando `await auth()`
- Se pasa la sesión al `SessionProvider` como prop
- Se desactiva el polling automático con `refetchInterval={0}`

### 2. Optimización de API Routes
- Se cambió de `auth()` a `getToken()` en `/api/history` para evitar llamadas adicionales
- El token JWT ahora contiene toda la información necesaria del usuario

### 3. Lógica de Base de Datos Movida
- La lógica de creación/verificación de usuarios se movió del callback `session` al callback `signIn`
- Esto evita consultas a la base de datos en cada validación de sesión

### 4. Configuración Necesaria

Asegúrate de tener configurada la variable de entorno:

```bash
NEXTAUTH_SECRET=tu-secret-aqui
```

Para generar un secret seguro:
```bash
openssl rand -base64 32
```

## Beneficios

- **Reducción drástica de llamadas a `/api/auth/session`**: De decenas por segundo a una por navegación
- **Mejor rendimiento**: Sin consultas a DB en cada validación de sesión
- **Menor latencia**: Los datos del usuario están en el JWT
- **Menos carga en el servidor**: Sin polling automático de sesión

## Flujo Optimizado

1. Usuario hace login → `signIn` callback crea/verifica usuario en DB
2. Datos del usuario se guardan en el JWT token
3. Layout obtiene sesión del servidor una vez
4. Componentes cliente usan `useSession()` sin hacer fetch adicional
5. API routes usan `getToken()` para validación rápida 