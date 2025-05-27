import type { Adapter } from 'next-auth/adapters';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, account, session, verificationToken } from './schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export function DrizzleAdapter(): Adapter {
  return {
    async createUser(userData) {
      const newUser = await db
        .insert(user)
        .values({
          email: userData.email,
          firstName: userData.name?.split(' ')[0] || '',
          lastName: userData.name?.split(' ').slice(1).join(' ') || '',
          image: userData.image,
          provider: 'oauth',
        })
        .returning();

      return {
        id: newUser[0].id,
        email: newUser[0].email,
        name: `${newUser[0].firstName} ${newUser[0].lastName}`,
        image: newUser[0].image,
        emailVerified: null,
      };
    },

    async getUser(id) {
      const result = await db.select().from(user).where(eq(user.id, id));
      if (!result[0]) return null;

      const userData = result[0];
      return {
        id: userData.id,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        image: userData.image,
        emailVerified: null,
      };
    },

    async getUserByEmail(email) {
      const result = await db.select().from(user).where(eq(user.email, email));
      if (!result[0]) return null;

      const userData = result[0];
      return {
        id: userData.id,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        image: userData.image,
        emailVerified: null,
      };
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const result = await db
        .select({
          user: user,
          account: account,
        })
        .from(user)
        .innerJoin(account, eq(user.id, account.userId))
        .where(
          and(
            eq(account.provider, provider),
            eq(account.providerAccountId, providerAccountId),
          ),
        );

      if (!result[0]) return null;

      const userData = result[0].user;
      return {
        id: userData.id,
        email: userData.email,
        name: `${userData.firstName} ${userData.lastName}`,
        image: userData.image,
        emailVerified: null,
      };
    },

    async updateUser({ id, ...userData }) {
      const result = await db
        .update(user)
        .set({
          email: userData.email,
          firstName: userData.name?.split(' ')[0],
          lastName: userData.name?.split(' ').slice(1).join(' '),
          image: userData.image,
        })
        .where(eq(user.id, id))
        .returning();

      if (!result[0]) throw new Error('User not found');

      const updatedUser = result[0];
      return {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        image: updatedUser.image,
        emailVerified: null,
      };
    },

    async deleteUser(userId) {
      await db.delete(user).where(eq(user.id, userId));
    },

    async linkAccount(accountData) {
      await db.insert(account).values({
        userId: accountData.userId,
        type: accountData.type,
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
        refresh_token: accountData.refresh_token
          ? String(accountData.refresh_token)
          : null,
        access_token: accountData.access_token
          ? String(accountData.access_token)
          : null,
        expires_at: accountData.expires_at
          ? new Date(accountData.expires_at * 1000)
          : null,
        token_type: accountData.token_type
          ? String(accountData.token_type)
          : null,
        scope: accountData.scope ? String(accountData.scope) : null,
        id_token: accountData.id_token ? String(accountData.id_token) : null,
        session_state: accountData.session_state
          ? String(accountData.session_state)
          : null,
      });
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await db
        .delete(account)
        .where(
          and(
            eq(account.provider, provider),
            eq(account.providerAccountId, providerAccountId),
          ),
        );
    },

    async createSession({ sessionToken, userId, expires }) {
      const result = await db
        .insert(session)
        .values({
          sessionToken,
          userId,
          expires,
        })
        .returning();

      return {
        sessionToken: result[0].sessionToken,
        userId: result[0].userId,
        expires: result[0].expires,
      };
    },

    async getSessionAndUser(sessionToken) {
      const result = await db
        .select({
          session: session,
          user: user,
        })
        .from(session)
        .innerJoin(user, eq(session.userId, user.id))
        .where(eq(session.sessionToken, sessionToken));

      if (!result[0]) return null;

      const { session: sessionData, user: userData } = result[0];
      return {
        session: {
          sessionToken: sessionData.sessionToken,
          userId: sessionData.userId,
          expires: sessionData.expires,
        },
        user: {
          id: userData.id,
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          image: userData.image,
          emailVerified: null,
        },
      };
    },

    async updateSession({ sessionToken, ...sessionData }) {
      const result = await db
        .update(session)
        .set(sessionData)
        .where(eq(session.sessionToken, sessionToken))
        .returning();

      return {
        sessionToken: result[0].sessionToken,
        userId: result[0].userId,
        expires: result[0].expires,
      };
    },

    async deleteSession(sessionToken) {
      await db.delete(session).where(eq(session.sessionToken, sessionToken));
    },

    async createVerificationToken({ identifier, expires, token }) {
      const result = await db
        .insert(verificationToken)
        .values({
          identifier,
          expires,
          token,
        })
        .returning();

      return {
        identifier: result[0].identifier,
        expires: result[0].expires,
        token: result[0].token,
      };
    },

    async useVerificationToken({ identifier, token }) {
      const result = await db
        .delete(verificationToken)
        .where(
          and(
            eq(verificationToken.identifier, identifier),
            eq(verificationToken.token, token),
          ),
        )
        .returning();

      return result[0] || null;
    },
  };
}
