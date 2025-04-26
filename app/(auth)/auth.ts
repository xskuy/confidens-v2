import { compare } from 'bcrypt-ts';
import NextAuth, { type User as NextAuthUser, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUser } from '../../lib/db/queries';

import { authConfig } from './auth.config';

interface SessionUser extends NextAuthUser {
  id: string;
  firstName?: string | null;
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
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        try {
          const users = await getUser(email);

          if (users.length === 0) {
            return null;
          }

          const user = users[0];

          if (!user.password) {
            return null;
          }

          const passwordsMatch = await compare(password, user.password);

          if (!passwordsMatch) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
          } as NextAuthUser & { firstName?: string | null };
        } catch (dbError) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ('firstName' in user && user.firstName) {
          token.firstName = user.firstName;
        } else {
          token.firstName = undefined;
        }
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
      if (!session?.user) {
        return session;
      }
      session.user.id = token.id as string;
      session.user.name = token.firstName as string | null;

      return session as ExtendedSession;
    },
  },
});
