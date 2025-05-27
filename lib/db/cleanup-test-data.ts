import { config } from 'dotenv';
import { eq, like, or } from 'drizzle-orm';
import { db } from './utils';
import {
  user,
  organization,
  role,
  integration,
  chat,
  message,
  vote,
} from './schema';

// Cargar variables de entorno
config({ path: '.env.local' });

async function cleanupTestData() {
  console.log('🧹 Iniciando limpieza de datos de prueba...\n');

  try {
    // 1. Eliminar usuarios de prueba
    console.log('1️⃣ Eliminando usuarios de prueba...');
    const deletedUsers = await db
      .delete(user)
      .where(
        or(
          eq(user.email, 'test@example.com'),
          like(user.email, 'test-%@example.com'),
        ),
      )
      .returning();
    console.log(`✅ ${deletedUsers.length} usuarios eliminados`);

    // 2. Eliminar chats de prueba (solo por título)
    console.log('\n2️⃣ Eliminando chats de prueba...');
    const deletedChats = await db
      .delete(chat)
      .where(or(like(chat.title, '%prueba%'), like(chat.title, '%test%')))
      .returning();
    console.log(`✅ ${deletedChats.length} chats eliminados`);

    // 3. Eliminar integraciones de prueba
    console.log('\n3️⃣ Eliminando integraciones de prueba...');
    const deletedIntegrations = await db
      .delete(integration)
      .where(
        or(
          eq(integration.name, 'Slack Integration'),
          like(integration.name, '%Integration%'),
          like(integration.name, '%prueba%'),
          like(integration.name, '%test%'),
        ),
      )
      .returning();
    console.log(`✅ ${deletedIntegrations.length} integraciones eliminadas`);

    // 4. Eliminar roles de prueba
    console.log('\n4️⃣ Eliminando roles de prueba...');
    const deletedRoles = await db
      .delete(role)
      .where(
        or(
          eq(role.name, 'Admin'),
          eq(role.name, 'User'),
          like(role.name, '%test%'),
          like(role.name, '%prueba%'),
        ),
      )
      .returning();
    console.log(`✅ ${deletedRoles.length} roles eliminados`);

    // 5. Eliminar organizaciones de prueba
    console.log('\n5️⃣ Eliminando organizaciones de prueba...');
    const deletedOrgs = await db
      .delete(organization)
      .where(
        or(
          eq(organization.name, 'Empresa de Prueba'),
          like(organization.name, '%Prueba%'),
          like(organization.name, '%Test%'),
          like(organization.name, '%test%'),
        ),
      )
      .returning();
    console.log(`✅ ${deletedOrgs.length} organizaciones eliminadas`);

    // 6. Limpiar mensajes y votos huérfanos (solo si quedan)
    console.log('\n6️⃣ Limpiando registros huérfanos...');
    try {
      const deletedMessages = await db
        .delete(message)
        .where(like(message.id, 'test-message%'))
        .returning();
      console.log(`✅ ${deletedMessages.length} mensajes eliminados`);

      const deletedVotes = await db
        .delete(vote)
        .where(like(vote.messageId, 'test-message%'))
        .returning();
      console.log(`✅ ${deletedVotes.length} votos eliminados`);
    } catch (error) {
      console.log('⚠️ No se encontraron registros huérfanos para limpiar');
    }

    console.log('\n🎉 ¡Limpieza completada exitosamente!');
    console.log('Ahora puedes ejecutar las pruebas nuevamente.');
  } catch (error) {
    console.error('\n❌ Error durante la limpieza:', error);
    throw error;
  }
}

// Ejecutar la limpieza
cleanupTestData()
  .then(() => {
    console.log('\n✨ Limpieza finalizada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });
