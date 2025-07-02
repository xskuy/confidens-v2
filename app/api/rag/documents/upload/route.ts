import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

const RAG_API_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  // Verificar autenticación
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Extraer archivos del FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response('No files provided', { status: 400 });
    }

    const results: unknown[] = [];

    for (const file of files) {
      // Validar que sea PDF
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        results.push({
          fileName: file.name,
          success: false,
          error: 'Only PDF files are supported',
        });
        continue;
      }

      try {
        // Crear FormData para FastAPI
        const fastapiFormData = new FormData();
        fastapiFormData.append('file', file, file.name);

        // Llamar a la API FastAPI
        const response = await fetch(
          `${RAG_API_URL}/api/rag/documents/upload`,
          {
            method: 'POST',
            body: fastapiFormData,
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`FastAPI upload error for ${file.name}:`, errorText);

          results.push({
            fileName: file.name,
            success: false,
            error: `Upload failed: ${errorText}`,
          });
          continue;
        }

        const result = await response.json();

        results.push({
          fileName: file.name,
          success: true,
          documentId: result.document_id,
          chunksCount: result.chunks_count,
          message: result.message,
        });
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        results.push({
          fileName: file.name,
          success: false,
          error: 'Processing error',
        });
      }
    }

    // Verificar si al menos un archivo se procesó exitosamente
    const successCount = results.filter((r: any) => r.success).length;

    return Response.json(
      {
        success: successCount > 0,
        processed: results.length,
        successful: successCount,
        results,
      },
      {
        status: successCount > 0 ? 200 : 400,
      },
    );
  } catch (error) {
    console.error('Upload error:', error);

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
