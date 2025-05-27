'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/app/(auth)/auth';

interface UpdateProfileData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  workFunction?: string;
  confidensPreferences?: string;
}

export async function updateProfile(data: UpdateProfileData) {
  const session = await auth();

  if (!session?.user || session.user.id !== data.userId) {
    throw new Error('No autorizado');
  }

  try {
    // Aquí iría la lógica para actualizar el perfil en la base de datos
    // await db.update(user).set({
    //   firstName: data.firstName,
    //   lastName: data.lastName,
    //   email: data.email,
    //   bio: data.bio,
    // }).where(eq(user.id, data.userId));

    console.log('Actualizando perfil:', data);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Error al actualizar el perfil');
  }
}

export async function disconnectProvider(userId: string, provider: string) {
  const session = await auth();

  if (!session?.user || session.user.id !== userId) {
    throw new Error('No autorizado');
  }

  try {
    // Aquí iría la lógica para desconectar el proveedor
    // await db.delete(userTokens).where(
    //   and(
    //     eq(userTokens.userId, userId),
    //     eq(userTokens.provider, provider)
    //   )
    // );

    console.log(`Desconectando ${provider} para usuario ${userId}`);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error(`Error disconnecting ${provider}:`, error);
    throw new Error(`Error al desconectar ${provider}`);
  }
}

export async function updatePreferences(userId: string, preferences: any) {
  const session = await auth();

  if (!session?.user || session.user.id !== userId) {
    throw new Error('No autorizado');
  }

  try {
    // Aquí iría la lógica para actualizar las preferencias
    console.log('Actualizando preferencias:', preferences);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating preferences:', error);
    throw new Error('Error al actualizar las preferencias');
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  const session = await auth();

  if (!session?.user || session.user.id !== userId) {
    throw new Error('No autorizado');
  }

  try {
    // Aquí iría la lógica para cambiar la contraseña
    // 1. Verificar la contraseña actual
    // 2. Hash de la nueva contraseña
    // 3. Actualizar en la base de datos

    console.log('Cambiando contraseña para usuario:', userId);

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    throw new Error('Error al cambiar la contraseña');
  }
}

export async function deleteAccount(userId: string) {
  const session = await auth();

  if (!session?.user || session.user.id !== userId) {
    throw new Error('No autorizado');
  }

  try {
    // Aquí iría la lógica para eliminar la cuenta
    // 1. Eliminar tokens asociados
    // 2. Eliminar conversaciones/datos del usuario
    // 3. Eliminar el usuario

    console.log('Eliminando cuenta para usuario:', userId);

    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    throw new Error('Error al eliminar la cuenta');
  }
}
