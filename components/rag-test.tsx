'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Document {
  id: string;
  title: string;
  author: string;
  source: string;
  created_at: string;
  content_preview: string;
  chunks_count: number;
}

interface SearchResult {
  id: string;
  content: string;
  score: {
    logit: number;
    sigmoid: number;
  };
  metadata: {
    resource_id: string;
    title?: string;
    author?: string;
    source?: string;
  };
}

export function RagTest() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formulario de ingesta
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');

  // Formulario de búsqueda
  const [query, setQuery] = useState('');

  const handleIngestDocument = async () => {
    if (!title || !content || !source) {
      setError('Por favor completa todos los campos para la ingesta');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          source,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Ingesta exitosa:', result);

      // Limpiar formulario
      setTitle('');
      setContent('');
      setSource('');

      // Actualizar lista de documentos
      await handleListDocuments();
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

  const handleSearch = async () => {
    if (!query) {
      setError('Por favor ingresa una consulta de búsqueda');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          k_final: 5,
          min_sigmoid: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setSearchResults(result.results);
    } catch (err) {
      setError(
        `Error en búsqueda: ${err instanceof Error ? err.message : 'Error desconocido'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Prueba de APIs de RAG</h1>
        <p className="text-gray-600 mt-2">
          Prueba las APIs de ingesta, listado y búsqueda híbrida con Chroma
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingesta de Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>🗂️ Ingestar Documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título del documento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Fuente del documento"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <Textarea
              placeholder="Contenido del documento"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
            <Button
              onClick={handleIngestDocument}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Ingiriendo...' : 'Ingestar Documento'}
            </Button>
          </CardContent>
        </Card>

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Búsqueda Híbrida</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Escribe tu consulta aquí..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">
                  Resultados ({searchResults.length})
                </h4>
                {searchResults.map((result, index) => (
                  <div
                    key={result.id}
                    className="border rounded p-3 bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium">
                        {result.metadata.title || 'Sin título'}
                      </span>
                      <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                        {(result.score.sigmoid * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lista de Documentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>📚 Documentos en la Base de Datos</CardTitle>
          <Button
            onClick={handleListDocuments}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay documentos. Ingesta algunos documentos para empezar.
            </p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{doc.title}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {doc.chunks_count} chunks
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Por: {doc.author} | Fuente: {doc.source}
                  </p>
                  <p className="text-sm text-gray-700">{doc.content_preview}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
