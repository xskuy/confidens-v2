'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RagHeader } from '@/components/rag/rag-header';
import { DocumentUpload } from '@/components/rag/document-upload';
import { DocumentList } from '@/components/rag/document-list';
import { SearchSection } from '@/components/rag/search-section';
import type {
  Document,
  UploadedFile,
  SearchResult,
} from '@/components/rag/types';

export function RagTest() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  // Manejar cambio de pestañas según URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Cargar documentos al montar el componente
  useEffect(() => {
    handleListDocuments();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setSearchResults(result.results || []);
    } catch (err) {
      setError(
        `Error en búsqueda: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    } finally {
      setSearchLoading(false);
    }
  };

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
        if (!data.files) {
          setError('No se recibieron archivos');
          return;
        }

        const totalFiles = data.files.length;
        const pdfFiles = data.files.filter(
          (f) =>
            f.file.type === 'application/pdf' ||
            f.file.name.toLowerCase().endsWith('.pdf'),
        );

        if (pdfFiles.length === 0) {
          setError('No se encontraron archivos PDF para procesar');
          return;
        }

        // Agregar documentos con estado pendiente a la lista
        const pendingDocs: Document[] = pdfFiles.map((pdfFile, index) => ({
          id: `pending-${Date.now()}-${index}`,
          title: pdfFile.file.name,
          author: 'Procesando...',
          source: 'upload',
          created_at: new Date().toISOString(),
          content_preview: 'Archivo en procesamiento...',
          chunks_count: 0,
          status: 'pending' as const,
          statusMessage: 'En cola...',
        }));

        setDocuments((prev) => [...pendingDocs, ...prev]);

        // Procesar archivos uno por uno
        for (let i = 0; i < pdfFiles.length; i++) {
          const pdfFile = pdfFiles[i];
          const pendingDocId = pendingDocs[i].id;

          try {
            // Actualizar estado a procesando
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === pendingDocId
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
              throw new Error(
                `Error ${response.status}: ${response.statusText}`,
              );
            }

            const result = await response.json();

            // Remover documento pendiente y refrescar lista
            setDocuments((prev) =>
              prev.filter((doc) => doc.id !== pendingDocId),
            );
            await handleListDocuments();
          } catch (err) {
            // Marcar como fallido
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === pendingDocId
                  ? {
                      ...doc,
                      status: 'failed' as const,
                      statusMessage:
                        err instanceof Error
                          ? err.message
                          : 'Error desconocido',
                    }
                  : doc,
              ),
            );
          }
        }
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

        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Subir Documentos</TabsTrigger>
              <TabsTrigger value="search">Buscar</TabsTrigger>
              <TabsTrigger value="manage">Gestionar</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <DocumentUpload
                  onSubmit={handleDocumentUpload}
                  loading={loading}
                />
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <SearchSection
                onSearch={handleSearch}
                searchResults={searchResults}
                loading={searchLoading}
              />
            </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              <DocumentList
                documents={documents}
                onRefresh={handleListDocuments}
                onDelete={handleDeleteDocument}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
