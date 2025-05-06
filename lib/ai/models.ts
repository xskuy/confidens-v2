import { openai } from '@ai-sdk/openai';
import { google, type GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai'; // Import LanguageModel type
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { xai } from '@ai-sdk/xai';

// Define un ID descriptivo como modelo por defecto
export const DEFAULT_CHAT_MODEL_ID: string = 'openai-o4-mini';

// Tipo para la función del proveedor (ej. openai, google)
type ProviderFn = (...args: any[]) => LanguageModel;

// Interfaz con configuración completa del modelo
export interface ChatModelConfig {
  id: string; // ID único (ej. 'openai-gpt-4o-mini')
  name: string; // Nombre para UI (ej. 'GPT-4o mini')
  provider: 'openai' | 'google' | 'anthropic' | 'test' | 'xai'; // Nombre del proveedor
  apiProvider: ProviderFn; // La función real del proveedor (openai, google, etc.)
  modelName: string; // El nombre específico del modelo para la API (ej. 'gpt-4o-mini')
  description: string; // Descripción para UI
  supportsReasoning: boolean; // Indica si el modelo soporta razonamiento
  providerOptions?: Record<string, any>; // Opciones específicas del proveedor (opcional)
  // Otros campos opcionales...
}

// Lista de configuraciones de modelos
export const chatModelConfigurations: Array<ChatModelConfig> = [
  // OpenAI
  {
    id: 'openai-o4-mini',
    name: 'o4-mini',
    provider: 'openai',
    apiProvider: openai,
    modelName: 'o4-mini',
    description: 'Latest flagship model from OpenAI, multimodal.',
    supportsReasoning: true,
    providerOptions: {
      openai: {
        reasoningEffort: 'low',
      },
    },
  },
  {
    id: 'openai-gpt-4.1-nano',
    name: 'GPT-4.1 Nano',
    provider: 'openai',
    apiProvider: openai,
    modelName: 'gpt-4.1-nano',
    description: 'Latest flagship model from OpenAI, multimodal.',
    supportsReasoning: false,
  },
  // Google Gemini
  {
    id: 'gemini-2.5-flash-preview-04-17',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    apiProvider: google, // Referencia a la función google
    modelName: 'models/gemini-2.5-flash-preview-04-17',
    description: 'Fast and versatile model from Google.',
    supportsReasoning: true,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
  },
  // Anthropic Claude
  {
    id: 'anthropic-claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    apiProvider: anthropic,
    modelName: 'claude-3-5-sonnet-20240620',
    description:
      'Latest flagship model from Anthropic with reasoning capabilities.',
    supportsReasoning: true,
    providerOptions: {
      anthropic: {
        thinking: { type: 'enabled', budgetTokens: 12000 },
      } satisfies AnthropicProviderOptions,
    },
  },
  {
    id: 'grok-3-mini-beta',
    name: 'Grok 3 Mini Beta',
    provider: 'xai',
    apiProvider: xai,
    modelName: 'flash',
    description: 'Fast and versatile model from XAI.',
    supportsReasoning: true,
    providerOptions: {
      xai: {
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    },
  },
];

// Función helper para obtener configuración por ID
export function getModelConfig(id: string): ChatModelConfig | undefined {
  return chatModelConfigurations.find((model) => model.id === id);
}
