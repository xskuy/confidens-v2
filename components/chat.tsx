'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID, saveChatModelToCookie } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import type { PowerLevel } from '@/lib/ai/ai-models.config';
import { useDevMode } from '@/context/dev-mode';

export function Chat({
  id,
  initialMessages,
  selectedChatModel,
  selectedVisibilityType,
  isReadonly,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  selectedChatModel: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
}) {
  const { mutate } = useSWRConfig();

  const [internalSelectedChatModel, setInternalSelectedChatModel] =
    useState(selectedChatModel);
  const [selectedPower, setSelectedPower] = useState<PowerLevel>('medium');
  const [ragMode, setRagMode] = useState(false);
  const [isRagSearching, setIsRagSearching] = useState(false);
  const { isDevMode } = useDevMode();

  // Actualizar el modelo seleccionado cuando cambia el nivel de potencia
  useEffect(() => {
    if (!isReadonly && !isDevMode) {
      setInternalSelectedChatModel(selectedPower);
    }
  }, [selectedPower, isReadonly, isDevMode]);

  useEffect(() => {
    saveChatModelToCookie(internalSelectedChatModel);
  }, [internalSelectedChatModel]);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: {
      id,
      selectedChatModel: internalSelectedChatModel,
      isDevModeActive: isDevMode,
      ragMode,
    },
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
      setIsRagSearching(false);
    },
    onError: (e) => {
      console.error('Error details from useChat:', e);
      toast.error('An error occurred, please try again!');
      setIsRagSearching(false);
    },
  });

  // Efecto para detectar cuando cambia el status y terminar la búsqueda RAG
  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') {
      // Terminar búsqueda RAG cuando comience el processing/streaming
      setIsRagSearching(false);
    }
  }, [status]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  // Determinar si hay mensajes para cambiar el layout
  const hasMessages = messages.length > 0;

  // Función personalizada para manejar el submit con RAG
  const handleSubmitWithRAG = (
    event?: { preventDefault?: (() => void) | undefined } | undefined,
    chatRequestOptions?: any,
  ) => {
    if (ragMode && input.trim()) {
      setIsRagSearching(true);

      // Timeout de seguridad para evitar que se quede cargando indefinidamente
      setTimeout(() => {
        setIsRagSearching(false);
      }, 8000); // 8 segundos máximo para dar tiempo a la búsqueda RAG
    }
    handleSubmit(event, chatRequestOptions);
  };

  return (
    <>
      <div className="flex flex-col min-w-0 h-dvh bg-background">
        <ChatHeader
          chatId={id}
          selectedModelId={internalSelectedChatModel}
          selectedVisibilityType={selectedVisibilityType}
          isReadonly={isReadonly}
          setSelectedModelId={setInternalSelectedChatModel}
          selectedPower={selectedPower}
        />

        {hasMessages ? (
          // Layout normal cuando hay mensajes
          <>
            <Messages
              chatId={id}
              status={status}
              votes={votes}
              messages={messages}
              setMessages={setMessages}
              reload={reload}
              isReadonly={isReadonly}
              isArtifactVisible={isArtifactVisible}
              isRagSearching={isRagSearching}
            />

            <form className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full max-w-3xl">
              {!isReadonly && (
                <MultimodalInput
                  chatId={id}
                  input={input}
                  setInput={setInput}
                  handleSubmit={handleSubmitWithRAG}
                  status={status}
                  stop={stop}
                  attachments={attachments}
                  setAttachments={setAttachments}
                  messages={messages}
                  setMessages={setMessages}
                  append={append}
                  selectedPower={selectedPower}
                  setSelectedPower={setSelectedPower}
                  ragMode={ragMode}
                  setRagMode={setRagMode}
                />
              )}
            </form>
          </>
        ) : (
          // Layout centrado cuando no hay mensajes
          <div className="flex flex-col flex-1 items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl space-y-8">
              <Messages
                chatId={id}
                status={status}
                votes={votes}
                messages={messages}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                isArtifactVisible={isArtifactVisible}
                isRagSearching={isRagSearching}
              />

              <form className="flex mx-auto gap-2 w-full">
                {!isReadonly && (
                  <MultimodalInput
                    chatId={id}
                    input={input}
                    setInput={setInput}
                    handleSubmit={handleSubmitWithRAG}
                    status={status}
                    stop={stop}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    messages={messages}
                    setMessages={setMessages}
                    append={append}
                    selectedPower={selectedPower}
                    setSelectedPower={setSelectedPower}
                    showSuggestions={true}
                    ragMode={ragMode}
                    setRagMode={setRagMode}
                  />
                )}
              </form>
            </div>
          </div>
        )}
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
      />
    </>
  );
}
