import { auth } from '@/app/(auth)/auth';
import type { NextRequest } from 'next/server';

const FASTAPI_URL = process.env.RAG_API_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
  // Verificar sesión del usuario
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Extraer los archivos del FormData
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return new Response('No se enviaron archivos', { status: 400 });
    }

    const results: unknown[] = [];

    for (const file of files) {
      // Solo procesamos PDFs por ahora
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');

      if (!isPdf) {
        continue; // ignorar otros tipos por ahora
      }

      // Construir payload multipart para FastAPI
      const fastapiForm = new FormData();
      fastapiForm.append('pdf_file', file, file.name);
      fastapiForm.append('title', file.name.replace(/\.pdf$/i, ''));
      fastapiForm.append('author', session.user.email || 'Unknown');
      fastapiForm.append('version', '1.0.0');
      fastapiForm.append('source', 'upload');

      const resp = await fetch(`${FASTAPI_URL}/api/ingest/pdf`, {
        method: 'POST',
        body: fastapiForm,
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return new Response(`Error desde RAG server: ${errText}`, {
          status: 500,
        });
      }

      const json = await resp.json();
      results.push(json);
    }

    return Response.json(
      {
        success: true,
        processed: results.length,
        results,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error subiendo archivos:', error);
    return new Response('Error interno del servidor', { status: 500 });
  }
}
