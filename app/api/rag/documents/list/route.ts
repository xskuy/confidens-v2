import { auth } from '@/app/(auth)/auth';

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Hacer request al servidor FastAPI
    const response = await fetch(`${FASTAPI_URL}/api/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI error:', errorText);
      return new Response('Failed to list documents via FastAPI', {
        status: 500,
      });
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        documents: result.documents,
        totalResources: result.total_resources,
        totalChunks: result.total_chunks,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error listing documents:', error);

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
