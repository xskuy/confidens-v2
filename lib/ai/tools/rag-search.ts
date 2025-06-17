import { tool } from 'ai';
import { z } from 'zod';

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

interface RAGSearchResult {
  id: string;
  content: string;
  score: {
    logit: number;
    sigmoid: number;
  };
  metadata: {
    resource_id: string;
    title?: string;
    author?: string;
    source?: string;
  };
}

interface RAGSearchResponse {
  success: boolean;
  results: RAGSearchResult[];
  totalResults: number;
  context: string;
  query: string;
}

export const ragSearch = tool({
  description:
    'Busca información relevante en la base de documentos usando RAG (Retrieval-Augmented Generation) para responder preguntas basándose en documentos específicos.',
  parameters: z.object({
    query: z.string().describe('La pregunta o consulta del usuario'),
    k_final: z
      .number()
      .optional()
      .default(5)
      .describe('Número máximo de resultados a devolver'),
    min_sigmoid: z
      .number()
      .optional()
      .default(0.3)
      .describe('Puntuación mínima de relevancia (0-1)'),
    max_per_doc: z
      .number()
      .optional()
      .default(2)
      .describe('Máximo de fragmentos por documento'),
  }),
  execute: async ({ query, k_final, min_sigmoid, max_per_doc }) => {
    try {
      console.log(`🔍 RAG Search: "${query}"`);

      // Validar que la query no esté vacía
      if (!query.trim()) {
        return {
          success: false,
          error: 'La consulta no puede estar vacía',
          context: '',
          results: [],
        };
      }

      // Preparar datos para la búsqueda
      const searchData = {
        query: query.trim(),
        k_final,
        min_sigmoid,
        max_per_doc,
        group_by_doc: true, // Agrupar por documento para mayor diversidad
      };

      // Hacer request al servidor FastAPI
      const response = await fetch(`${FASTAPI_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
        signal: AbortSignal.timeout(30000), // Timeout de 30 segundos
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en FastAPI:', errorText);

        if (response.status === 503) {
          return {
            success: false,
            error:
              'El servidor de RAG no está disponible. Asegúrate de que FastAPI esté ejecutándose en el puerto 8000.',
            context: '',
            results: [],
          };
        }

        return {
          success: false,
          error: `Error del servidor RAG: ${response.status}`,
          context: '',
          results: [],
        };
      }

      const result: RAGSearchResponse = await response.json();

      // Validar respuesta
      if (!result.success) {
        return {
          success: false,
          error: 'La búsqueda no fue exitosa',
          context: result.context || '',
          results: result.results || [],
        };
      }

      // Si no hay resultados
      if (!result.results || result.results.length === 0) {
        return {
          success: true,
          message:
            'No se encontraron documentos relevantes para tu consulta. Intenta reformular la pregunta o usar términos diferentes.',
          context: '',
          results: [],
          query: result.query,
        };
      }

      // Formatear resultados para el LLM
      const formattedResults = result.results.map((item, index) => ({
        position: index + 1,
        relevance: `${(item.score.sigmoid * 100).toFixed(1)}%`,
        content: item.content,
        source:
          item.metadata.title || item.metadata.source || 'Documento sin título',
        author: item.metadata.author || 'Autor desconocido',
      }));

      console.log(
        `✅ RAG Search completado: ${result.results.length} resultados encontrados`,
      );

      return {
        success: true,
        totalResults: result.totalResults,
        context: result.context,
        results: formattedResults,
        query: result.query,
        summary: `Encontré ${result.totalResults} fragmentos relevantes de ${new Set(result.results.map((r) => r.metadata.resource_id)).size} documentos diferentes.`,
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
          results: [],
        };
      }

      return {
        success: false,
        error: 'Error interno en la búsqueda RAG',
        context: '',
        results: [],
      };
    }
  },
});
