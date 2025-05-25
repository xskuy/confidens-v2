/* eslint-disable import/no-unresolved */
import {
  type UIMessage,
  appendResponseMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
} from 'ai';
import { auth } from '@/app/(auth)/auth';
import { systemPrompt } from '@/lib/ai/prompts';
import {
  deleteChatById,
  getChatById,
  saveChat,
  saveMessages,
} from '@/lib/db/queries';
import {
  generateUUID,
  getMostRecentUserMessage,
  getTrailingMessageId,
} from '@/lib/utils';
import { generateTitleFromUserMessage } from '../../actions';
import { createDocument } from '@/lib/ai/tools/create-document';
import { updateDocument } from '@/lib/ai/tools/update-document';
import { requestSuggestions } from '@/lib/ai/tools/request-suggestions';
import { getWeather } from '@/lib/ai/tools/get-weather';
import { isProductionEnvironment } from '@/lib/constants';
import {
  AI_MODELS_CONFIGURATION,
  type AIModelConfig,
  type PowerLevel,
} from '../../../../lib/ai/ai-models.config';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const {
      id,
      messages,
      selectedChatModel,
      isDevModeActive,
    }: {
      id: string;
      messages: Array<UIMessage>;
      selectedChatModel: string;
      isDevModeActive: boolean;
    } = await request.json();

    console.log('📩 Chat API received:', {
      payload_selectedChatModel: selectedChatModel,
      payload_isDevModeActive: isDevModeActive,
    });

    // Asegurar que isDevModeActive sea un booleano explícito
    const devModeEnabled = isDevModeActive === true;

    console.log(`🔍 Dev Mode: ${devModeEnabled ? 'ON ✅' : 'OFF ❌'}`);

    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userMessage = getMostRecentUserMessage(messages);

    if (!userMessage) {
      return new Response('No user message found', { status: 400 });
    }

    const chat = await getChatById({ id });

    if (!chat) {
      const title = await generateTitleFromUserMessage({
        message: userMessage,
      });

      await saveChat({ id, userId: session.user.id, title });
    } else {
      if (chat.userId !== session.user.id) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    await saveMessages({
      messages: [
        {
          chatId: id,
          id: userMessage.id,
          role: 'user',
          parts: userMessage.parts,
          attachments: userMessage.experimental_attachments ?? [],
          createdAt: new Date(),
        },
      ],
    });

    let finalModelConfig: AIModelConfig | undefined;

    if (devModeEnabled) {
      console.log(
        `🔧 Dev Mode ON: Buscando config para ID -> ${selectedChatModel}`,
      );
      finalModelConfig = Object.values(AI_MODELS_CONFIGURATION).find(
        (config) => config.id === selectedChatModel,
      );
      if (!finalModelConfig) {
        console.warn(
          `⚠️ Dev Mode ON: No se encontró config para ID "${selectedChatModel}". Usando MEDIUM por defecto.`,
        );
        finalModelConfig = AI_MODELS_CONFIGURATION.medium;
      }
    } else {
      console.log(
        `👤 Dev Mode OFF: Usando PowerSelector. Nivel recibido -> ${selectedChatModel}`,
      );
      // Validamos que el valor recibido sea una PowerLevel válida
      if (
        selectedChatModel === 'low' ||
        selectedChatModel === 'medium' ||
        selectedChatModel === 'high'
      ) {
        const powerLevelKey = selectedChatModel as PowerLevel;
        finalModelConfig = AI_MODELS_CONFIGURATION[powerLevelKey];
      } else {
        // IMPORTANTE: en modo no-dev, intentamos recuperar por ID por si se está pasando
        // directamente el ID completo (podría ocurrir al cambiar entre modos)
        const modelByCompleteId = Object.values(AI_MODELS_CONFIGURATION).find(
          (config) => config.id === selectedChatModel,
        );

        if (modelByCompleteId) {
          console.log(
            `🔄 Encontrado modelo por ID completo: ${modelByCompleteId.id}`,
          );
          finalModelConfig = modelByCompleteId;
        } else {
          console.warn(
            `⚠️ Dev Mode OFF: PowerLevel "${selectedChatModel}" no válido. Usando MEDIUM por defecto.`,
          );
          finalModelConfig = AI_MODELS_CONFIGURATION.medium;
        }
      }
    }

    if (!finalModelConfig) {
      console.error(
        '❌ Error crítico: No se pudo determinar finalModelConfig. Usando MEDIUM.',
      );
      finalModelConfig = AI_MODELS_CONFIGURATION.medium;
    }

    console.log(
      `Chosen model config: ID: ${finalModelConfig.id}, Provider: ${finalModelConfig.provider}, API ModelName: ${finalModelConfig.modelName}`,
    );

    return createDataStreamResponse({
      execute: (dataStream) => {
        console.log(
          '🚀 Starting streamText with API Model Name:',
          finalModelConfig.modelName,
          'for provider:',
          finalModelConfig.provider,
        );
        try {
          const modelCallOptions = {
            model: finalModelConfig.modelName,
          };

          if (finalModelConfig.providerOptions) {
            if (
              finalModelConfig.provider === 'google' &&
              finalModelConfig.providerOptions.google
            ) {
              console.log(
                'Google provider options:',
                finalModelConfig.providerOptions.google,
              );
            } else if (
              finalModelConfig.provider === 'openai' &&
              finalModelConfig.providerOptions.openai
            ) {
              console.log(
                'OpenAI provider options:',
                finalModelConfig.providerOptions.openai,
              );
            } else if (finalModelConfig.provider === 'xai') {
              console.log(
                'XAI provider options:',
                finalModelConfig.providerOptions,
              );
            }
          }

          console.log('Model call options for AI SDK:', modelCallOptions);

          const result = streamText({
            model:
              finalModelConfig.provider === 'openai'
                ? finalModelConfig.apiProvider.languageModel(
                    finalModelConfig.modelName,
                    finalModelConfig.providerOptions?.openai || {},
                  )
                : finalModelConfig.provider === 'google'
                  ? finalModelConfig.apiProvider.languageModel(
                      finalModelConfig.modelName,
                      finalModelConfig.providerOptions?.google || {},
                    )
                  : finalModelConfig.provider === 'xai'
                    ? finalModelConfig.apiProvider.languageModel(
                        finalModelConfig.modelName,
                        finalModelConfig.providerOptions || {},
                      )
                    : finalModelConfig.apiProvider.languageModel(
                        modelCallOptions,
                      ),
            system: systemPrompt({ selectedChatModel: finalModelConfig.id }),
            messages,
            maxSteps: 5,
            experimental_activeTools:
              finalModelConfig.id === AI_MODELS_CONFIGURATION.high.id
                ? [
                    'getWeather',
                    'createDocument',
                    'updateDocument',
                    'requestSuggestions',
                  ]
                : [],
            experimental_transform: smoothStream({ chunking: 'word' }),
            experimental_generateMessageId: generateUUID,
            tools: {
              getWeather,
              createDocument: createDocument({ session, dataStream }),
              updateDocument: updateDocument({ session, dataStream }),
              requestSuggestions: requestSuggestions({
                session,
                dataStream,
              }),
            },
            onFinish: async ({ response }) => {
              console.log('✅ Stream finished successfully');
              if (session.user?.id) {
                try {
                  const assistantId = getTrailingMessageId({
                    messages: response.messages.filter(
                      (message) => message.role === 'assistant',
                    ),
                  });

                  if (!assistantId) {
                    throw new Error('No assistant message found!');
                  }

                  const [, assistantMessage] = appendResponseMessages({
                    messages: [userMessage],
                    responseMessages: response.messages,
                  });

                  await saveMessages({
                    messages: [
                      {
                        id: assistantId,
                        chatId: id,
                        role: assistantMessage.role,
                        parts: assistantMessage.parts,
                        attachments:
                          assistantMessage.experimental_attachments ?? [],
                        createdAt: new Date(),
                      },
                    ],
                  });
                } catch (_) {
                  console.error('Failed to save chat');
                }
              }
            },
            experimental_telemetry: {
              isEnabled: isProductionEnvironment,
              functionId: 'stream-text',
            },
          });

          console.log('🔄 Stream created, preparing to consume...');
          result.consumeStream();
          console.log('🔄 Stream consumption started');

          result.mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          });
          console.log('🔄 Stream merged into dataStream');
        } catch (error) {
          console.error('❌ Error in streamText execution:', error);
          throw error;
        }
      },
      onError: (error) => {
        console.error('❌ Error in data stream response:', error);
        return 'Oops, an error occurred!';
      },
    });
  } catch (error) {
    console.error('❌ Unhandled error in POST handler:', error);
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response('Forbidden', { status: 403 });
    }

    const deletedChat = await deleteChatById({ id });

    return Response.json(deletedChat, { status: 200 });
  } catch (error) {
    return new Response('An error occurred while processing your request!', {
      status: 500,
    });
  }
}
