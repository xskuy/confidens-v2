import { config } from 'dotenv';
import {
  createUser,
  getUser,
  saveChat,
  getChatsByUserId,
  saveMessages,
  getMessagesByChatId,
  voteMessage,
  deleteChatById,
} from './queries';

// Cargar variables de entorno
config({ path: '.env.local' });

async function testDatabase() {
  console.log('🚀 Iniciando pruebas de base de datos en Supabase...\n');

  try {
    // Verificar conexión
    console.log('🔍 Verificando conexión a Supabase...');
    const testEmail = `test_${Date.now()}@confidens.ai`;

    // 1. Test User Creation
    console.log('\n📝 Test 1: Creación de Usuario');
    const testUser = await createUser({
      email: testEmail,
      password: 'Test123!',
      firstName: 'Test',
      lastName: 'User',
    }).catch((error) => {
      console.error('Error creando usuario:', error.message);
      throw error;
    });
    console.log('✅ Usuario creado:', {
      id: testUser.id,
      email: testUser.email,
    });

    // 2. Test User Retrieval
    console.log('\n📝 Test 2: Búsqueda de Usuario');
    const foundUser = await getUser(testEmail).catch((error) => {
      console.error('Error buscando usuario:', error.message);
      throw error;
    });
    console.log('✅ Usuario encontrado:', foundUser ? '✓' : '✗');

    // 3. Test Chat Creation
    console.log('\n📝 Test 3: Creación de Chat');
    const chatId = `test-${Date.now()}`;
    const newChat = await saveChat({
      id: chatId,
      userId: testUser.id,
      title: 'Chat de Prueba',
      visibility: 'private',
    }).catch((error) => {
      console.error('Error creando chat:', error.message);
      throw error;
    });
    console.log('✅ Chat creado:', { id: newChat.id, title: newChat.title });

    // 4. Test Messages
    console.log('\n📝 Test 4: Creación de Mensajes');
    const testMessages = [
      {
        id: `msg-1-${Date.now()}`,
        chatId: newChat.id,
        role: 'user',
        parts: [{ content: 'Hola, esto es una prueba' }],
        attachments: [],
        createdAt: new Date(),
      },
      {
        id: `msg-2-${Date.now()}`,
        chatId: newChat.id,
        role: 'assistant',
        parts: [{ content: 'Respuesta de prueba' }],
        attachments: [],
        createdAt: new Date(),
      },
    ];
    await saveMessages(testMessages).catch((error) => {
      console.error('Error guardando mensajes:', error.message);
      throw error;
    });
    console.log('✅ Mensajes guardados');

    // 5. Test Message Retrieval
    console.log('\n📝 Test 5: Recuperación de Mensajes');
    const messages = await getMessagesByChatId(newChat.id).catch((error) => {
      console.error('Error recuperando mensajes:', error.message);
      throw error;
    });
    console.log('✅ Mensajes recuperados:', messages.length);

    // 6. Test Chat Listing
    console.log('\n📝 Test 6: Listado de Chats');
    const userChats = await getChatsByUserId({
      userId: testUser.id,
      limit: 10,
    }).catch((error) => {
      console.error('Error listando chats:', error.message);
      throw error;
    });
    console.log('✅ Chats encontrados:', userChats.chats.length);

    // 7. Test Voting
    console.log('\n📝 Test 7: Sistema de Votos');
    await voteMessage({
      chatId: newChat.id,
      messageId: testMessages[1].id,
      type: 'up',
    }).catch((error) => {
      console.error('Error registrando voto:', error.message);
      throw error;
    });
    console.log('✅ Voto registrado');

    // 8. Test Chat Deletion
    console.log('\n📝 Test 8: Eliminación de Chat');
    const deletedChat = await deleteChatById(newChat.id).catch((error) => {
      console.error('Error eliminando chat:', error.message);
      throw error;
    });
    console.log('✅ Chat eliminado:', deletedChat ? '✓' : '✗');

    console.log('\n🎉 Todas las pruebas completadas con éxito!');
  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    process.exit(1);
  }
}

testDatabase().catch((error) => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});
