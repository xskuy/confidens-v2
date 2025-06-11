import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

interface DeleteDocumentRequest {
  resource_id: string;
}

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data: DeleteDocumentRequest = await request.json();

    // Validación de campos requeridos
    if (!data.resource_id) {
      return new Response('Missing required field: resource_id', {
        status: 400,
      });
    }

    // Hacer request al servidor FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resource_id: data.resource_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error:', errorText);

      // Manejar error 404 específicamente
      if (response.status === 404) {
        return new Response('Document not found', { status: 404 });
      }

      return new Response('Failed to delete document via FastAPI', {
        status: 500,
      });
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        message: result.message,
        resourceId: result.resource_id,
        chunksDeleted: result.chunks_deleted,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting document:', error);

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
