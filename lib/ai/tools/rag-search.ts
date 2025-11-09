import { tool } from 'ai';
import { z } from 'zod';

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

interface RAGSearchResponse {
  success: boolean;
  context: string;
  query: string;
  message?: string;
}

export const ragSearch = tool({
  description:
    'Busca información relevante en la base de documentos usando RAG (Retrieval-Augmented Generation) para responder preguntas basándose en documentos específicos.',
  parameters: z.object({
    query: z.string().describe('La pregunta o consulta del usuario'),
  }),
  execute: async ({ query }) => {
    try {
      console.log(`🔍 RAG Search: "${query}"`);

      // Validar que la query no esté vacía
      if (!query.trim()) {
        return {
          success: false,
          error: 'La consulta no puede estar vacía',
          context: '',
        };
      }

      // Hacer request al servidor FastAPI con parámetros optimizados para más contexto
      const response = await fetch(`${FASTAPI_URL}/api/rag/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          k: 15, // Aumentado para capturar más fragmentos
          threshold: 0.1, // Muy permisivo para no perder información relevante
        }),
        signal: AbortSignal.timeout(30000), // Timeout de 30 segundos
      });

      if (!response.ok) {
        console.error('Error en FastAPI:', response.status);

        if (response.status === 503) {
          return {
            success: false,
            error:
              'El servidor de RAG no está disponible. Asegúrate de que FastAPI esté ejecutándose en el puerto 8000.',
            context: '',
          };
        }

        return {
          success: false,
          error: `Error del servidor RAG: ${response.status}`,
          context: '',
        };
      }

      const result: RAGSearchResponse = await response.json();

      // Si no hay contexto relevante
      if (!result.context || result.context.trim() === '') {
        return {
          success: true,
          message:
            'No se encontraron documentos relevantes para tu consulta. Intenta reformular la pregunta o usar términos diferentes.',
          context: '',
        };
      }

      console.log(`✅ RAG Search completado: contexto obtenido`);

      // Devolver solo el contexto procesado
      return {
        success: true,
        context: result.context,
        query: result.query,
      };
    } catch (error) {
      console.error('Error en RAG search:', error);

      // Manejo específico de errores comunes
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error:
            'No se pudo conectar con el servidor RAG. Verifica que FastAPI esté ejecutándose.',
          context: '',
        };
      }

      return {
        success: false,
        error: 'Error interno en la búsqueda RAG',
        context: '',
      };
    }
  },
});
