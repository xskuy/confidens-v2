'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SearchResult } from './types';

interface SearchSectionProps {
  onSearch: (query: string) => void;
  searchResults: SearchResult[];
  loading: boolean;
}

export function SearchSection({
  onSearch,
  searchResults,
  loading,
}: SearchSectionProps) {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Búsqueda Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="¿Qué información necesitas encontrar?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading || !query.trim()}>
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">
              Resultados ({searchResults.length})
            </h4>
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="border rounded-lg p-4 bg-gradient-to-r from-primary/5 to-primary/10"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium">
                    {result.metadata.title || 'Sin título'}
                  </span>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full font-medium">
                    {(result.score.sigmoid * 100).toFixed(1)}% relevancia
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {result.content}
                </p>
                {result.metadata.source && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Fuente: {result.metadata.source}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
