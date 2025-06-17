import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

interface SearchRequest {
  query: string;
  k_final?: number;
  min_sigmoid?: number;
  max_per_doc?: number;
  group_by_doc?: boolean;
}

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data: SearchRequest = await request.json();

    // Validación de campos requeridos
    if (!data.query) {
      return new Response('Missing required field: query', {
        status: 400,
      });
    }

    // Valores por defecto
    const searchData = {
      query: data.query,
      k_final: data.k_final || 10,
      min_sigmoid: data.min_sigmoid || 0.5,
      max_per_doc: data.max_per_doc || 3,
      group_by_doc: data.group_by_doc ?? false,
    };

    // Hacer request al servidor FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error:', errorText);

      // Devolver resultados vacíos cuando FastAPI no está disponible
      return Response.json(
        {
          success: false,
          results: [],
          query: data.query,
          totalResults: 0,
          context: '',
          error: 'connection_failed',
          message:
            'No se puede conectar al servidor RAG para realizar búsquedas.',
        },
        { status: 200 },
      );
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        results: result.results,
        query: data.query,
        totalResults: result.total_results,
        context: result.context,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in hybrid search:', error);

    // Verificar si es un error de conexión con FastAPI
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.log('🔌 Error de conexión con servidor RAG para búsqueda');

      return Response.json(
        {
          success: false,
          results: [],
          query: 'consulta sin procesar',
          totalResults: 0,
          context: '',
          error: 'connection_refused',
          message:
            'Servidor RAG no disponible. Ejecuta "./start-dev.sh" para iniciarlo.',
        },
        { status: 200 },
      );
    }

    // Para otros errores, devolver resultados vacíos también
    return Response.json(
      {
        success: false,
        results: [],
        query: 'error',
        totalResults: 0,
        context: '',
        error: 'unknown_error',
        message: 'Error inesperado al realizar la búsqueda.',
      },
      { status: 200 },
    );
  }
}
