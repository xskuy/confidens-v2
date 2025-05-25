import { cookies } from 'next/headers';
import { Chat } from '../../components/chat';
import { DEFAULT_CHAT_MODEL_ID, getModelConfig } from '../../lib/ai/models';
import { generateUUID } from '../../lib/utils';
import { DataStreamHandler } from '../../components/data-stream-handler';

export default async function Page() {
  const id = generateUUID();
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  // Validar si el modelo en la cookie existe en la configuración
  let selectedChatModel = DEFAULT_CHAT_MODEL_ID;
  if (chatModelFromCookie) {
    // Solo usar el valor de la cookie si el modelo existe en la configuración
    const modelExists = getModelConfig(chatModelFromCookie.value);
    if (modelExists) {
      selectedChatModel = chatModelFromCookie.value;
    }
    // Si no existe, usamos el modelo por defecto (DEFAULT_CHAT_MODEL_ID)
  }

  return (
    <>
      <Chat
        id={id}
        initialMessages={[]}
        selectedChatModel={selectedChatModel}
        selectedVisibilityType={'private'}
        isReadonly={false}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
