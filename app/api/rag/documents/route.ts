import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

interface IngestDocumentRequest {
  title: string;
  author: string;
  content_type: string;
  version: string;
  content: string;
  source: string;
}

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data: IngestDocumentRequest = await request.json();

    // Validación de campos requeridos
    if (!data.title || !data.content || !data.source) {
      return new Response('Missing required fields: title, content, source', {
        status: 400,
      });
    }

    // Valores por defecto
    const documentData = {
      title: data.title,
      author: data.author || session.user.email || 'Unknown',
      content_type: data.content_type || 'document',
      version: data.version || '1.0.0',
      content: data.content,
      source: data.source,
    };

    // Hacer request al servidor FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(documentData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error:', errorText);
      return new Response('Failed to ingest document via FastAPI', {
        status: 500,
      });
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        message: result.message,
        resourceId: result.resource_id,
        chunksCount: result.chunks_count,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error in document ingestion:', error);

    // Verificar si es un error de conexión con FastAPI
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Response(
        'RAG server is not available. Please ensure the FastAPI server is running on port 8000.',
        {
          status: 503,
        },
      );
    }

    return new Response('Internal server error', { status: 500 });
  }
}
