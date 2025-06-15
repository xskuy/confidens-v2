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

      // Devolver lista vacía cuando FastAPI no está disponible
      return Response.json(
        {
          success: false,
          documents: [],
          totalResources: 0,
          totalChunks: 0,
          error: 'connection_failed',
          message:
            'No se puede conectar al servidor RAG. Verifica que esté ejecutándose.',
        },
        { status: 200 },
      );
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
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.log('🔌 Error de conexión con servidor RAG');

      return Response.json(
        {
          success: false,
          documents: [],
          totalResources: 0,
          totalChunks: 0,
          error: 'connection_refused',
          message:
            'Servidor RAG no disponible. Ejecuta "./start-dev.sh" para iniciarlo.',
        },
        { status: 200 },
      );
    }

    // Para otros errores, devolver lista vacía también
    return Response.json(
      {
        success: false,
        documents: [],
        totalResources: 0,
        totalChunks: 0,
        error: 'unknown_error',
        message: 'Error inesperado al cargar documentos.',
      },
      { status: 200 },
    );
  }
}
