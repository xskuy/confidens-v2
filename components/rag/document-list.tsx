'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Trash2,
  Upload,
  Search,
  MoreHorizontal,
  Filter,
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { Document, DocumentStatus } from './types';

// Componente del icono PDF
const PdfIcon = ({ className = 'size-6' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    className={className}
    fill="currentColor"
  >
    <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 144-208 0c-35.3 0-64 28.7-64 64l0 144-48 0c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zM176 352l32 0c30.9 0 56 25.1 56 56s-25.1 56-56 56l-16 0 0 32c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-48 0-80c0-8.8 7.2-16 16-16zm32 80c13.3 0 24-10.7 24-24s-10.7-24-24-24l-16 0 0 48 16 0zm96-80l32 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-32 0c-8.8 0-16-7.2-16-16l0-128c0-8.8 7.2-16 16-16zm32 128c8.8 0 16-7.2 16-16l0-64c0-8.8-7.2-16-16-16l-16 0 0 96 16 0zm80-112c0-8.8 7.2-16 16-16l48 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 32 32 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-32 0 0 48c0 8.8-7.2 16-16 16s-16-7.2-16-16l0-64 0-64z" />
  </svg>
);

interface DocumentListProps {
  documents: Document[];
  onRefresh: () => void;
  onDelete: (id: string, title: string) => void;
  loading: boolean;
}

export function DocumentList({
  documents,
  onRefresh,
  onDelete,
  loading,
}: DocumentListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusIcon = (status: DocumentStatus = 'completed') => {
    switch (status) {
      case 'pending':
        return <Clock className="size-4 text-yellow-500" />;
      case 'processing':
        return <Loader2 className="size-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'failed':
        return <XCircle className="size-4 text-red-500" />;
      default:
        return <CheckCircle className="size-4 text-green-500" />;
    }
  };

  const getStatusText = (
    status: DocumentStatus = 'completed',
    message?: string,
  ) => {
    const statusTexts = {
      pending: 'Pendiente',
      processing: 'Procesando...',
      completed: 'Completado',
      failed: 'Error',
    };
    return message || statusTexts[status];
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatFileSize = (chunks: number) => {
    // Estimación aproximada: 1 chunk ≈ 1KB
    if (chunks < 1024) return `${chunks} KB`;
    if (chunks < 1024 * 1024) return `${(chunks / 1024).toFixed(1)} MB`;
    return `${(chunks / (1024 * 1024)).toFixed(1)} GB`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFileIcon = (title: string) => {
    const extension = title.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return <PdfIcon />;
    if (['doc', 'docx'].includes(extension || '')) return '📘';
    if (['xls', 'xlsx'].includes(extension || '')) return '📊';
    if (['ppt', 'pptx'].includes(extension || '')) return '📁';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return '🖼️';
    return <PdfIcon />;
  };

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            📚 Base de Conocimiento
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={onRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="size-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Total: {documents.length} documentos</span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="size-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg mb-2">
              Tu base de conocimiento está vacía
            </p>
            <p className="text-muted-foreground/70 text-sm">
              Sube algunos documentos para empezar a construir tu sistema RAG
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded" />
                </TableHead>
                <TableHead className="font-medium">
                  Nombre del Archivo
                </TableHead>
                <TableHead className="font-medium text-center">
                  Estado
                </TableHead>
                <TableHead className="font-medium text-center">
                  Tamaño
                </TableHead>
                <TableHead className="font-medium text-center">
                  Última Modificación
                </TableHead>
                <TableHead className="font-medium text-center">
                  Subido Por
                </TableHead>
                <TableHead className="font-medium text-center">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50">
                  <TableCell>
                    <input type="checkbox" className="rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 flex items-center justify-center text-red-600">
                        {getFileIcon(doc.title)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">
                          {doc.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {doc.source}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getStatusIcon(doc.status)}
                      <span className="text-sm">
                        {getStatusText(doc.status, doc.statusMessage)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      {formatFileSize(doc.chunks_count)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {doc.chunks_count} fragmentos
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm">
                      {new Date(doc.created_at).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(doc.author)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {doc.author}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(doc.id, doc.title)}
                        disabled={loading}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
