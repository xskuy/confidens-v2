import {
  createUser,
  getUser,
  saveChat,
  getChatsByUserId,
  saveMessages,
  getMessagesByChatId,
  voteMessage,
} from './queries';
import { randomUUID } from 'node:crypto';

async function testQueries() {
  try {
    console.log('🧪 Iniciando pruebas de queries...\n');

    // Generar IDs únicos válidos
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const chatId = randomUUID(); // Genera un UUID válido
    const messageId1 = randomUUID(); // Genera un UUID válido
    const messageId2 = randomUUID(); // Genera un UUID válido

    // 1. Crear un usuario de prueba
    console.log('1️⃣ Creando usuario de prueba...');
    const testUser = await createUser({
      email: testEmail,
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
    });
    console.log('✅ Usuario creado:', testUser);

    // 2. Obtener el usuario creado
    console.log('\n2️⃣ Obteniendo usuario por email...');
    const foundUser = await getUser(testEmail);
    console.log('✅ Usuario encontrado:', foundUser);

    // 3. Crear un chat
    console.log('\n3️⃣ Creando chat de prueba...');
    const chat = await saveChat({
      id: chatId,
      userId: testUser.id,
      title: 'Chat de prueba',
      visibility: 'private',
    });
    console.log('✅ Chat creado:', chat);

    // 4. Obtener chats del usuario
    console.log('\n4️⃣ Obteniendo chats del usuario...');
    const userChats = await getChatsByUserId({
      userId: testUser.id,
      limit: 10,
    });
    console.log('✅ Chats encontrados:', userChats);

    // 5. Guardar mensajes
    console.log('\n5️⃣ Guardando mensajes de prueba...');
    const messages = [
      {
        id: messageId1,
        chatId: chat.id,
        role: 'user',
        parts: { content: 'Hola, esto es un mensaje de prueba' },
        attachments: {},
        createdAt: new Date(),
      },
      {
        id: messageId2,
        chatId: chat.id,
        role: 'assistant',
        parts: { content: 'Este es un mensaje de respuesta' },
        attachments: {},
        createdAt: new Date(),
      },
    ];
    await saveMessages(messages);
    console.log('✅ Mensajes guardados');

    // 6. Obtener mensajes del chat
    console.log('\n6️⃣ Obteniendo mensajes del chat...');
    const chatMessages = await getMessagesByChatId(chat.id);
    console.log('✅ Mensajes encontrados:', chatMessages);

    // 7. Votar un mensaje
    console.log('\n7️⃣ Votando mensaje...');
    await voteMessage({
      chatId: chat.id,
      messageId: messageId2,
      type: 'up',
    });
    console.log('✅ Voto registrado');

    console.log('\n✨ Todas las pruebas completadas con éxito!');
  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
  }
}

// Ejecutar las pruebas
testQueries().catch(console.error);
