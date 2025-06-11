'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { RagHeader } from '@/components/rag/rag-header';
import { DocumentUpload } from '@/components/rag/document-upload';
import { DocumentList } from '@/components/rag/document-list';
import type { Document, UploadedFile } from '@/components/rag/types';

export function RagTest() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar documentos al montar el componente
  useEffect(() => {
    handleListDocuments();
  }, []);

  const handleDocumentUpload = async (data: {
    mode: 'manual' | 'files';
    manual?: { title: string; content: string; source: string };
    files?: UploadedFile[];
  }) => {
    if (data.mode === 'manual' && data.manual) {
      const { title, content, source } = data.manual;
      if (!title || !content || !source) {
        setError('Por favor completa todos los campos para la ingesta');
        return;
      }
    } else if (data.mode === 'files' && data.files) {
      if (data.files.length === 0) {
        setError('Por favor sube al menos un archivo');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (data.mode === 'manual' && data.manual) {
        const response = await fetch('/api/rag/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data.manual),
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Ingesta exitosa:', result);

        // Actualizar lista de documentos
        await handleListDocuments();
      } else {
        // TODO: Implementar subida de archivos
        console.log('Archivos a procesar:', data.files);
        setError('Funcionalidad de archivos en desarrollo');
        return;
      }
    } catch (err) {
      setError(
        `Error en ingesta: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleListDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/documents/list');

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setDocuments(result.documents);
    } catch (err) {
      setError(
        `Error al listar documentos: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (resourceId: string, title: string) => {
    if (
      !confirm(`¿Estás seguro de que quieres borrar el documento "${title}"?`)
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resource_id: resourceId,
        }),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('El documento no fue encontrado');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Borrado exitoso:', result);

      // Actualizar lista de documentos después del borrado
      await handleListDocuments();
    } catch (err) {
      setError(
        `Error al borrar documento: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <RagHeader />

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-8 overflow-y-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Sistema RAG - Base de Conocimiento
          </h1>
          <p className="text-muted-foreground mt-2">
            Sube documentos, PDFs, imágenes y más para crear tu base de
            conocimiento inteligente
          </p>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-4">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="max-w-2xl mx-auto">
          <DocumentUpload onSubmit={handleDocumentUpload} loading={loading} />
        </div>

        <DocumentList
          documents={documents}
          onRefresh={handleListDocuments}
          onDelete={handleDeleteDocument}
          loading={loading}
        />
      </div>
    </div>
  );
}
