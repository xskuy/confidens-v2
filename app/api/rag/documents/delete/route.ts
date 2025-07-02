import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

interface DeleteDocumentRequest {
  document_id: string;
}

const RAG_API_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const data: DeleteDocumentRequest = await request.json();

    // Validación de campos requeridos
    if (!data.document_id?.trim()) {
      return new Response('Missing required field: document_id', {
        status: 400,
      });
    }

    // Llamar a la API FastAPI
    const response = await fetch(
      `${RAG_API_URL}/api/rag/documents/${data.document_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI delete error:', errorText);

      // Manejar errores específicos
      if (response.status === 404) {
        return new Response('Document not found', { status: 404 });
      }

      return new Response('Failed to delete document', { status: 500 });
    }

    const result = await response.json();

    return Response.json(
      {
        success: true,
        message: result.message || 'Document deleted successfully',
        documentId: data.document_id,
        deletedChunks: result.deleted_chunks || 0,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Delete document error:', error);

    // Error de conexión con FastAPI
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new Response(
        'RAG server unavailable. Please ensure FastAPI server is running.',
        { status: 503 },
      );
    }

    return new Response('Internal server error', { status: 500 });
  }
}
