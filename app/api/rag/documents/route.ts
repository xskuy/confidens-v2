import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

// Este endpoint ahora solo redirige a la API FastAPI
// La lógica de procesamiento está completamente en FastAPI

const RAG_API_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Extraer parámetros de query
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';

    // Llamar a la API FastAPI
    const response = await fetch(
      `${RAG_API_URL}/api/rag/documents?page=${page}&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI documents error:', errorText);

      return Response.json(
        {
          success: false,
          documents: [],
          totalDocuments: 0,
          error: 'fetch_failed',
          message: 'Failed to retrieve documents',
        },
        { status: 200 },
      );
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        documents: result.documents || [],
        totalDocuments: result.total_documents || 0,
        pagination: result.pagination || null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Documents GET error:', error);

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return Response.json(
        {
          success: false,
          documents: [],
          totalDocuments: 0,
          error: 'connection_failed',
          message: 'RAG server unavailable',
        },
        { status: 200 },
      );
    }

    return new Response('Internal server error', { status: 500 });
  }
}

// POST method removed - use /upload endpoint instead
