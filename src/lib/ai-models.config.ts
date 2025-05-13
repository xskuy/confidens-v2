import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';

/**
 * Define la estructura de configuración para un modelo de IA específico.
 */

// Exportar PowerLevel
export type PowerLevel = 'low' | 'medium' | 'high';

// Ajustar tipo de apiProvider. Usaremos 'any' temporalmente para simplificar.
// Idealmente, sería: typeof google | typeof openai | typeof xai
// type ProviderFn = (...args: any[]) => LanguageModel; // Remover este tipo antiguo
export type AIModelConfig = {
  id: string; // ID único (ej. 'openai-gpt-4o-mini')
  name: string; // Nombre para UI (ej. 'GPT-4o mini')
  provider: 'openai' | 'google' | 'anthropic' | 'test' | 'xai'; // Nombre del proveedor
  apiProvider: any; // Temporalmente any. Debería ser la unión de los tipos de proveedor importados.
  modelName: string; // El nombre específico del modelo para la API (ej. 'gpt-4o-mini')
  description: string; // Descripción para UI
  supportsReasoning: boolean; // Indica si el modelo soporta razonamiento
  providerOptions?: Record<string, any>; // Opciones específicas del proveedor (opcional)
  // Otros campos opcionales...
};

/**
 * Configuración de los modelos de IA disponibles para cada nivel de potencia.
 * Mapea cada PowerLevel a la configuración del modelo correspondiente.
 */
export const AI_MODELS_CONFIGURATION: Record<PowerLevel, AIModelConfig> = {
  low: {
    id: 'gemini-2.5-flash-preview-04-17',
    name: 'Rápido',
    provider: 'google',
    apiProvider: google,
    modelName: 'models/gemini-2.5-flash-preview-04-17',
    description: 'Modelo rápido y versátil de Google.',
    supportsReasoning: true,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    },
  },
  medium: {
    id: 'grok-3-mini-beta',
    name: 'Normal',
    provider: 'xai',
    apiProvider: xai,
    modelName: 'grok-3-mini-beta',
    description: 'Modelo equilibrado y versátil de XAI.',
    supportsReasoning: true,
    providerOptions: {
      thinkingConfig: {
        thinkingBudget: 2048,
      },
    },
  },
  high: {
    id: 'openai-o4-mini',
    name: 'Avanzado',
    provider: 'openai',
    apiProvider: openai,
    modelName: 'o4-mini',
    description: 'Modelo avanzado multimodal de OpenAI.',
    supportsReasoning: true,
    providerOptions: {
      openai: {
        reasoningEffort: 'low',
      },
    },
  },
};

/**
 * Obtiene la configuración del modelo para un nivel de potencia específico.
 * @param powerLevel El nivel de potencia ('low', 'medium', 'high').
 * @returns La configuración del modelo correspondiente.
 */
export function getModelConfig(powerLevel: PowerLevel): AIModelConfig {
  return AI_MODELS_CONFIGURATION[powerLevel];
}
