import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

interface SearchRequest {
  query: string;
  k?: number;
  threshold?: number;
}

const RAG_API_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data: SearchRequest = await request.json();

    // Validación de campos requeridos
    if (!data.query?.trim()) {
      return new Response('Missing required field: query', { status: 400 });
    }

    // Preparar datos para FastAPI
    const searchData = {
      query: data.query.trim(),
      k: data.k || 5,
      threshold: data.threshold || 0.5,
    };

    // Llamar a la API FastAPI
    const response = await fetch(`${RAG_API_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI search error:', errorText);

      // Devolver respuesta vacía en caso de error
      return Response.json(
        {
          success: false,
          query: data.query,
          results: [],
          totalResults: 0,
          error: 'search_failed',
          message: 'Search operation failed',
        },
        { status: 200 },
      );
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        query: data.query,
        results: result.results || [],
        totalResults: result.total_results || 0,
        context: result.context || '',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Search error:', error);

    // Error de conexión con FastAPI
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return Response.json(
        {
          success: false,
          query: 'connection_error',
          results: [],
          totalResults: 0,
          error: 'connection_failed',
          message:
            'RAG server unavailable. Please ensure FastAPI server is running.',
        },
        { status: 200 },
      );
    }

    // Otros errores
    return Response.json(
      {
        success: false,
        query: 'error',
        results: [],
        totalResults: 0,
        error: 'unknown_error',
        message: 'Unexpected error during search',
      },
      { status: 200 },
    );
  }
}
