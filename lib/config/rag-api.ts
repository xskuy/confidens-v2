/**
 * Configuración centralizada para la API RAG FastAPI
 */

export const RAG_API_CONFIG = {
  baseUrl: process.env.RAG_API_URL || 'http://127.0.0.1:8000',
  endpoints: {
    search: '/api/rag/search',
    documents: '/api/rag/documents',
    upload: '/api/rag/documents/upload',
    delete: (documentId: string) => `/api/rag/documents/${documentId}`,
    health: '/api/rag/health',
  },
  timeout: 30000, // 30 segundos
} as const;

/**
 * Construye la URL completa para un endpoint
 */
export function buildApiUrl(endpoint: string): string {
  return `${RAG_API_CONFIG.baseUrl}${endpoint}`;
}

/**
 * Headers comunes para las requests a la API
 */
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
} as const;
