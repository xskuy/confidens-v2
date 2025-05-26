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
      if (!session?.user || !token) {
        return session;
      }

      // Con JWT strategy, el user viene del token
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.image = token.image as string;

      return session as ExtendedSession;
    },
  },
  debug: process.env.NODE_ENV === 'development',
});
