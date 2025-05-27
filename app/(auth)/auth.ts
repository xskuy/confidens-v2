import NextAuth, { type User as NextAuthUser, type Session } from 'next-auth';
import Google from 'next-auth/providers/google';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

import { authConfig } from './auth.config';

interface SessionUser extends NextAuthUser {
  id: string;
  firstName?: string | null;
  email: string;
  image: string;
}

interface ExtendedSession extends Session {
  user: SessionUser;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  // Comentamos temporalmente el adaptador para usar JWT
  // adapter: DrizzleAdapter(),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt', // Cambiamos a JWT temporalmente
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile: any) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
    MicrosoftEntraID({
      id: 'microsoft-entra-id',
      name: 'Microsoft',
      clientId: process.env.MICROSOFT_ENTRA_ID_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_ENTRA_ID_CLIENT_SECRET,
      issuer: process.env.MICROSOFT_ENTRA_ID_ISSUER,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔐 SignIn callback:', {
        provider: account?.provider,
        user: user,
        account: account,
        profile: profile,
      });
      return true;
    },
    async jwt({ token, user, account }) {
      // Con JWT strategy, manejamos los datos en el token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
      console.log('📝 Session callback:', { session, token });
      if (!session?.user || !token?.id || !token?.email) {
        console.warn('⚠️ Session o token inválido en callback de session.');
        return session;
      }

      try {
        const postgres = (await import('postgres')).default;
        const databaseUrl = process.env.POSTGRES_URL;
        if (!databaseUrl) {
          console.error('❌ POSTGRES_URL no está configurada.');
          return session; // No se puede continuar sin URL de DB
        }
        const client = postgres(databaseUrl);

        // Verificar si el usuario ya existe por email
        const existingUserByEmail = await client<[{ id: string }]>`
          SELECT id FROM "User" WHERE email = ${token.email}
        `;

        if (!existingUserByEmail || existingUserByEmail.count === 0) {
          // Usuario no existe con este email, intentar crearlo con token.id
          try {
            const nameParts = (token.name as string)?.split(' ') || ['', ''];
            const firstName = nameParts[0] || 'Usuario';
            const lastName = nameParts.slice(1).join(' ') || 'OAuth';

            await client`
              INSERT INTO "User" (id, email, first_name, last_name, image, provider, created_at, updated_at)
              VALUES (${token.id}, ${token.email}, ${firstName}, ${lastName}, ${token.image || null}, 'oauth', NOW(), NOW())
            `;
            console.log(
              `✅ Nuevo usuario OAuth (id: ${token.id}) insertado en DB via auth.ts: ${token.email}`,
            );
            session.user.id = token.id as string; // Confirmar que session.user.id es token.id
          } catch (insertError: any) {
            if (insertError.code === '23505') {
              // Unique violation
              // Puede ser conflicto en `email` (si otro proceso lo creó) o en `id` (si token.id ya existe con otro email)
              console.warn(
                `🔶 Conflicto al insertar (id: ${token.id}, email: ${token.email}) en auth.ts. Asumiendo que el email ya existe y recuperando por email. Error: ${insertError.message}`,
              );
              const userByEmail = await client<
                [{ id: string }]
              >`SELECT id FROM "User" WHERE email = ${token.email}`;
              if (userByEmail && userByEmail.count > 0) {
                session.user.id = userByEmail[0].id;
                token.id = userByEmail[0].id; // Sincronizar token.id
                console.log(
                  `👤 Usuario recuperado por email (${token.email}), ID de sesión establecido a: ${session.user.id}`,
                );
              } else {
                // Esto sería un caso extraño: fallo al insertar, pero tampoco se encuentra por email.
                // Podría ser un conflicto de ID primario, y el email del token es diferente al email del ID existente.
                console.error(
                  `❌ No se pudo insertar ni recuperar usuario por email ${token.email} tras fallo de inserción. Verifique si el ID ${token.id} ya existe con otro email.`,
                );
                session.user.id = token.id as string; // Mantener token.id como fallback problemático
              }
            } else {
              console.error(
                `❌ Error crítico insertando usuario (id: ${token.id}, email: ${token.email}) en auth.ts:`,
                insertError,
              );
              session.user.id = token.id as string; // Mantener token.id
            }
          }
        } else {
          // Usuario con este email ya existe. Su ID en la DB es existingUserByEmail[0].id.
          const dbUserId = existingUserByEmail[0].id;
          if (token.id !== dbUserId) {
            console.warn(
              `🔄 ID Mismatch: token.id (${token.id}) vs DB User.id (${dbUserId}) for email ${token.email}. Usando DB User.id (${dbUserId}) para la sesión.`,
            );
            token.id = dbUserId; // Asegurar que el token refleje el ID de la DB
          }
          session.user.id = dbUserId; // Usar el ID de la base de datos existente
          console.log(
            `☑️ Usuario OAuth con email ${token.email} ya existe en DB. ID de sesión establecido a: ${session.user.id}`,
          );
        }

        await client.end();
      } catch (error) {
        console.error(
          '❌ Error crítico en callback de session (manejo de DB):',
          error,
        );
      }

      // Asignar datos del token (potencialmente actualizado) a la sesión
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.image = token.image as string;
      // session.user.id ya debería estar correctamente establecido arriba

      return session as ExtendedSession;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
