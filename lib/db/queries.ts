import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  organization,
  role,
  integration,
  type Organization,
  type Role,
  type Integration,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { db, generateHashedPassword } from './utils';

// User queries
export async function getUser(email: string): Promise<User | null> {
  try {
    const [foundUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, email));
    return foundUser || null;
  } catch (error) {
    console.error('[GetUser] Failed to get user:', error);
    throw error;
  }
}

export async function createUser({
  email,
  password,
  firstName,
  lastName,
  organizationId,
  roleId,
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  roleId?: string;
}): Promise<User> {
  const hashedPassword = await generateHashedPassword(password);

  try {
    const [insertedUser] = await db
      .insert(user)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        organizationId,
        roleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return insertedUser;
  } catch (error) {
    console.error('[CreateUser] Failed to create user:', error);
    throw error;
  }
}

// Chat queries
export async function saveChat({
  id,
  userId,
  title,
  visibility = 'private',
}: {
  id: string;
  userId: string;
  title: string;
  visibility?: 'private' | 'public';
}): Promise<Chat> {
  try {
    const [newChat] = await db
      .insert(chat)
      .values({
        id,
        createdAt: new Date(),
        userId,
        title,
        visibility,
      })
      .returning();
    return newChat;
  } catch (error) {
    console.error('[SaveChat] Failed to save chat:', error);
    throw error;
  }
}

export async function deleteChatById(id: string): Promise<Chat | null> {
  try {
    // Eliminar registros relacionados primero
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    const [deletedChat] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return deletedChat || null;
  } catch (error) {
    console.error('[DeleteChat] Failed to delete chat:', error);
    throw error;
  }
}

export async function getChatsByUserId({
  userId,
  limit,
  startingAfter,
  endingBefore,
}: {
  userId: string;
  limit: number;
  startingAfter?: string;
  endingBefore?: string;
}) {
  try {
    const extendedLimit = limit + 1;
    let whereCondition: SQL<unknown> | undefined;

    if (startingAfter) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, startingAfter))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${startingAfter} not found`);
      }

      whereCondition = and(
        eq(chat.userId, userId),
        gt(chat.createdAt, selectedChat.createdAt),
      );
    } else if (endingBefore) {
      const [selectedChat] = await db
        .select()
        .from(chat)
        .where(eq(chat.id, endingBefore))
        .limit(1);

      if (!selectedChat) {
        throw new Error(`Chat with id ${endingBefore} not found`);
      }

      whereCondition = and(
        eq(chat.userId, userId),
        lt(chat.createdAt, selectedChat.createdAt),
      );
    } else {
      whereCondition = eq(chat.userId, userId);
    }

    const chats = await db
      .select()
      .from(chat)
      .where(whereCondition)
      .orderBy(desc(chat.createdAt))
      .limit(extendedLimit);

    const hasMore = chats.length > limit;

    return {
      chats: hasMore ? chats.slice(0, limit) : chats,
      hasMore,
    };
  } catch (error) {
    console.error('[GetChats] Failed to get chats:', error);
    throw error;
  }
}

// Message queries
export async function saveMessages(messages: Array<DBMessage>): Promise<void> {
  try {
    await db.insert(message).values(messages);
  } catch (error) {
    console.error('[SaveMessages] Failed to save messages:', error);
    throw error;
  }
}

export async function getMessagesByChatId(
  chatId: string,
): Promise<DBMessage[]> {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, chatId))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('[GetMessages] Failed to get messages:', error);
    throw error;
  }
}

// Vote queries
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}): Promise<void> {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));

    if (existingVote) {
      await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    } else {
      await db.insert(vote).values({
        chatId,
        messageId,
        isUpvoted: type === 'up',
      });
    }
  } catch (error) {
    console.error('[VoteMessage] Failed to vote message:', error);
    throw error;
  }
}

// Organization queries
export async function createOrganization({
  name,
  description,
  planType = 'free',
}: {
  name: string;
  description?: string;
  planType?: string;
}): Promise<Organization> {
  try {
    const [newOrganization] = await db
      .insert(organization)
      .values({
        name,
        description,
        planType,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newOrganization;
  } catch (error) {
    console.error('[CreateOrganization] Failed to create organization:', error);
    throw error;
  }
}

export async function getOrganizationById(
  id: string,
): Promise<Organization | null> {
  try {
    const [foundOrganization] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, id));
    return foundOrganization || null;
  } catch (error) {
    console.error('[GetOrganization] Failed to get organization:', error);
    throw error;
  }
}

export async function updateOrganization({
  id,
  name,
  description,
  planType,
}: {
  id: string;
  name?: string;
  description?: string;
  planType?: string;
}): Promise<Organization | null> {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (planType !== undefined) updateData.planType = planType;

    const [updatedOrganization] = await db
      .update(organization)
      .set(updateData)
      .where(eq(organization.id, id))
      .returning();
    return updatedOrganization || null;
  } catch (error) {
    console.error('[UpdateOrganization] Failed to update organization:', error);
    throw error;
  }
}

export async function deleteOrganization(
  id: string,
): Promise<Organization | null> {
  try {
    const [deletedOrganization] = await db
      .delete(organization)
      .where(eq(organization.id, id))
      .returning();
    return deletedOrganization || null;
  } catch (error) {
    console.error('[DeleteOrganization] Failed to delete organization:', error);
    throw error;
  }
}

export async function getAllOrganizations(): Promise<Organization[]> {
  try {
    return await db
      .select()
      .from(organization)
      .where(eq(organization.isActive, true))
      .orderBy(asc(organization.name));
  } catch (error) {
    console.error('[GetAllOrganizations] Failed to get organizations:', error);
    throw error;
  }
}

// Role queries
export async function createRole({
  name,
  description,
  permissions = {},
}: {
  name: string;
  description?: string;
  permissions?: Record<string, any>;
}): Promise<Role> {
  try {
    const [newRole] = await db
      .insert(role)
      .values({
        name,
        description,
        permissions,
        createdAt: new Date(),
      })
      .returning();
    return newRole;
  } catch (error) {
    console.error('[CreateRole] Failed to create role:', error);
    throw error;
  }
}

export async function getRoleById(id: string): Promise<Role | null> {
  try {
    const [foundRole] = await db.select().from(role).where(eq(role.id, id));
    return foundRole || null;
  } catch (error) {
    console.error('[GetRole] Failed to get role:', error);
    throw error;
  }
}

export async function updateRole({
  id,
  name,
  description,
  permissions,
}: {
  id: string;
  name?: string;
  description?: string;
  permissions?: Record<string, any>;
}): Promise<Role | null> {
  try {
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (permissions !== undefined) updateData.permissions = permissions;

    const [updatedRole] = await db
      .update(role)
      .set(updateData)
      .where(eq(role.id, id))
      .returning();
    return updatedRole || null;
  } catch (error) {
    console.error('[UpdateRole] Failed to update role:', error);
    throw error;
  }
}

export async function deleteRole(id: string): Promise<Role | null> {
  try {
    const [deletedRole] = await db
      .delete(role)
      .where(eq(role.id, id))
      .returning();
    return deletedRole || null;
  } catch (error) {
    console.error('[DeleteRole] Failed to delete role:', error);
    throw error;
  }
}

export async function getAllRoles(): Promise<Role[]> {
  try {
    return await db.select().from(role).orderBy(asc(role.name));
  } catch (error) {
    console.error('[GetAllRoles] Failed to get roles:', error);
    throw error;
  }
}

// Integration queries
export async function createIntegration({
  name,
  type,
  config,
  organizationId,
}: {
  name: string;
  type: string;
  config: Record<string, any>;
  organizationId: string;
}): Promise<Integration> {
  try {
    const [newIntegration] = await db
      .insert(integration)
      .values({
        name,
        type,
        config,
        organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newIntegration;
  } catch (error) {
    console.error('[CreateIntegration] Failed to create integration:', error);
    throw error;
  }
}

export async function getIntegrationById(
  id: string,
): Promise<Integration | null> {
  try {
    const [foundIntegration] = await db
      .select()
      .from(integration)
      .where(eq(integration.id, id));
    return foundIntegration || null;
  } catch (error) {
    console.error('[GetIntegration] Failed to get integration:', error);
    throw error;
  }
}

export async function getIntegrationsByOrganizationId(
  organizationId: string,
): Promise<Integration[]> {
  try {
    return await db
      .select()
      .from(integration)
      .where(
        and(
          eq(integration.organizationId, organizationId),
          eq(integration.isActive, true),
        ),
      )
      .orderBy(asc(integration.name));
  } catch (error) {
    console.error(
      '[GetIntegrationsByOrganization] Failed to get integrations:',
      error,
    );
    throw error;
  }
}

export async function updateIntegration({
  id,
  name,
  type,
  config,
  isActive,
}: {
  id: string;
  name?: string;
  type?: string;
  config?: Record<string, any>;
  isActive?: boolean;
}): Promise<Integration | null> {
  try {
    const updateData: any = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (config !== undefined) updateData.config = config;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updatedIntegration] = await db
      .update(integration)
      .set(updateData)
      .where(eq(integration.id, id))
      .returning();
    return updatedIntegration || null;
  } catch (error) {
    console.error('[UpdateIntegration] Failed to update integration:', error);
    throw error;
  }
}

export async function deleteIntegration(
  id: string,
): Promise<Integration | null> {
  try {
    const [deletedIntegration] = await db
      .delete(integration)
      .where(eq(integration.id, id))
      .returning();
    return deletedIntegration || null;
  } catch (error) {
    console.error('[DeleteIntegration] Failed to delete integration:', error);
    throw error;
  }
}

// User queries with organization and role relationships
export async function getUserWithOrganizationAndRole(
  email: string,
): Promise<(User & { organization?: Organization; role?: Role }) | null> {
  try {
    const result = await db
      .select({
        user: user,
        organization: organization,
        role: role,
      })
      .from(user)
      .leftJoin(organization, eq(user.organizationId, organization.id))
      .leftJoin(role, eq(user.roleId, role.id))
      .where(eq(user.email, email))
      .limit(1);

    if (!result.length) return null;

    const { user: userData, organization: orgData, role: roleData } = result[0];
    return {
      ...userData,
      organization: orgData || undefined,
      role: roleData || undefined,
    };
  } catch (error) {
    console.error(
      '[GetUserWithOrgAndRole] Failed to get user with relationships:',
      error,
    );
    throw error;
  }
}

export async function getUsersByOrganizationId(
  organizationId: string,
): Promise<User[]> {
  try {
    return await db
      .select()
      .from(user)
      .where(
        and(eq(user.organizationId, organizationId), eq(user.isActive, true)),
      )
      .orderBy(asc(user.firstName), asc(user.lastName));
  } catch (error) {
    console.error(
      '[GetUsersByOrganization] Failed to get users by organization:',
      error,
    );
    throw error;
  }
}
