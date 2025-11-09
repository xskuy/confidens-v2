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

  const handleDocumentUpload = async (data: { files: UploadedFile[] }) => {
    if (data.files.length === 0) {
      setError('No se recibió el archivo PDF');
      return;
    }

    const pdfFile = data.files[0]; // Solo procesamos un archivo

    if (
      !pdfFile.file.type.includes('pdf') &&
      !pdfFile.file.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('El archivo debe ser un PDF');
      return;
    }

    setLoading(true);
    setError(null);

    // Agregar documento con estado pendiente
    const pendingDoc: Document = {
      id: `pending-${Date.now()}`,
      title: pdfFile.file.name,
      author: 'Procesando...',
      source: 'upload',
      created_at: new Date().toISOString(),
      content_preview: 'Archivo en procesamiento...',
      chunks_count: 0,
      status: 'pending' as const,
      statusMessage: 'En cola...',
    };

    setDocuments((prev) => [pendingDoc, ...prev]);

    try {
      // Actualizar estado a procesando
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === pendingDoc.id
            ? {
                ...doc,
                status: 'processing' as const,
                statusMessage: 'Extrayendo texto...',
              }
            : doc,
        ),
      );

      const formData = new FormData();
      formData.append('files', pdfFile.file, pdfFile.file.name);

      const response = await fetch('/api/rag/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Remover documento pendiente y refrescar lista
      setDocuments((prev) => prev.filter((doc) => doc.id !== pendingDoc.id));
      await handleListDocuments();
    } catch (err) {
      // Marcar como fallido
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === pendingDoc.id
            ? {
                ...doc,
                status: 'failed' as const,
                statusMessage:
                  err instanceof Error ? err.message : 'Error desconocido',
              }
            : doc,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleListDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/documents');

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const formattedDocuments = result.documents.map((doc: any) => ({
        ...doc.payload,
        id: doc.id,
      }));
      setDocuments(formattedDocuments);
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
          document_id: resourceId,
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

        {/* Sección de subida */}
        <div className="max-w-2xl mx-auto mb-8">
          <DocumentUpload onSubmit={handleDocumentUpload} loading={loading} />
        </div>

        {/* Sección de documentos existentes - ancho completo */}
        <div className="border-t pt-8 w-full">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Documentos Existentes</h2>
          </div>
          <DocumentList
            documents={documents}
            onRefresh={handleListDocuments}
            onDelete={handleDeleteDocument}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
