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

      // Mover la lógica de base de datos aquí para ejecutarla solo una vez
      if (user.email) {
        try {
          const postgres = (await import('postgres')).default;
          const databaseUrl = process.env.POSTGRES_URL;
          if (!databaseUrl) {
            console.error('❌ POSTGRES_URL no está configurada.');
            return false;
          }
          const client = postgres(databaseUrl);

          // Verificar si el usuario ya existe por email
          const existingUserByEmail = await client`
            SELECT id FROM "User" WHERE email = ${user.email}
          `;

          if (existingUserByEmail.length === 0) {
            // Usuario no existe, crearlo
            try {
              const nameParts = (user.name as string)?.split(' ') || ['', ''];
              const firstName = nameParts[0] || 'Usuario';
              const lastName = nameParts.slice(1).join(' ') || 'OAuth';
              const userId = user.id || crypto.randomUUID();

              await client`
                INSERT INTO "User" (id, email, first_name, last_name, image, provider, created_at, updated_at)
                VALUES (${userId}, ${user.email}, ${firstName}, ${lastName}, ${user.image || null}, 'oauth', NOW(), NOW())
              `;
              user.id = userId;
              console.log(
                `✅ Nuevo usuario OAuth (id: ${user.id}) insertado en DB: ${user.email}`,
              );
            } catch (insertError: any) {
              if (insertError.code === '23505') {
                // Usuario ya existe, obtener su ID
                const userByEmail = await client`
                  SELECT id FROM "User" WHERE email = ${user.email}
                `;
                if (userByEmail.length > 0) {
                  user.id = userByEmail[0].id;
                  console.log(
                    `👤 Usuario recuperado por email (${user.email}), ID: ${user.id}`,
                  );
                }
              } else {
                console.error(`❌ Error insertando usuario:`, insertError);
                await client.end();
                return false;
              }
            }
          } else {
            // Usuario existe, usar su ID
            user.id = existingUserByEmail[0].id;
            console.log(
              `☑️ Usuario OAuth con email ${user.email} ya existe. ID: ${user.id}`,
            );
          }

          await client.end();
        } catch (error) {
          console.error('❌ Error en signIn callback:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Guardar toda la información necesaria en el token
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
      // Solo asignar los datos del token a la sesión, sin consultas a DB
      if (session?.user && token?.id) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string;
      }

      return session as ExtendedSession;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
