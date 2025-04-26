import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  DEFAULT_CHAT_MODEL_ID,
  getModelConfig,
  chatModelConfigurations,
} from './models';

import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

function getConfiguredChatModel(modelId: string = DEFAULT_CHAT_MODEL_ID) {
  const config = getModelConfig(modelId);
  if (!config) {
    const defaultConfig = getModelConfig(DEFAULT_CHAT_MODEL_ID);
    if (!defaultConfig) {
      throw new Error('Default model configuration not found.');
    }

    // Si hay providerOptions, usarlas
    if (defaultConfig.providerOptions) {
      return defaultConfig.apiProvider(
        defaultConfig.modelName,
        defaultConfig.providerOptions,
      );
    }

    return defaultConfig.apiProvider(defaultConfig.modelName);
  }

  // Si hay providerOptions, usarlas
  if (config.providerOptions) {
    return config.apiProvider(config.modelName, config.providerOptions);
  }

  return config.apiProvider(config.modelName);
}

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': getConfiguredChatModel(),
        'chat-model-reasoning': wrapLanguageModel({
          model: getConfiguredChatModel(
            chatModelConfigurations.find((m) => m.supportsReasoning)?.id ||
              DEFAULT_CHAT_MODEL_ID,
          ),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': getConfiguredChatModel('openai-o4-mini'),
        'artifact-model': getConfiguredChatModel(),
      },
      imageModels: {
        // TODO: Manejar modelos de imagen si es necesario
        // 'small-model': openai.image('o4-mini'),
      },
    });
