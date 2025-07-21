'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Upload, FileText, Image, File, Plus, X, PenTool } from 'lucide-react';
import type { UploadedFile } from './types';

interface DocumentUploadProps {
  onSubmit: (data: {
    mode: 'manual' | 'files';
    manual?: { title: string; content: string; source: string };
    files?: UploadedFile[];
  }) => void;
  loading: boolean;
}

export function DocumentUpload({ onSubmit, loading }: DocumentUploadProps) {
  const [uploadMode, setUploadMode] = useState<'manual' | 'files'>('files');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [filesDialogOpen, setFilesDialogOpen] = useState(false);

  const getFileType = (file: File): UploadedFile['type'] => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeType = file.type.toLowerCase();

    if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
    if (
      mimeType.includes('document') ||
      ['doc', 'docx', 'txt', 'rtf'].includes(extension || '')
    )
      return 'doc';
    if (
      mimeType.includes('image') ||
      ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(extension || '')
    )
      return 'image';
    if (extension === 'txt') return 'text';
    return 'other';
  };

  const getFileIcon = (type: UploadedFile['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="size-5 text-red-500" />;
      case 'doc':
        return <FileText className="size-5 text-blue-500" />;
      case 'image':
        return <Image className="size-5 text-green-500" />;
      case 'text':
        return <FileText className="size-5 text-gray-500" />;
      default:
        return <File className="size-5 text-gray-400" />;
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      type: getFileType(file),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleSubmit = () => {
    if (uploadMode === 'manual') {
      onSubmit({
        mode: 'manual',
        manual: { title, content, source },
      });
      setTitle('');
      setContent('');
      setSource('');
    } else {
      onSubmit({
        mode: 'files',
        files: uploadedFiles,
      });
      setUploadedFiles([]);
      setFilesDialogOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Dialog open={filesDialogOpen} onOpenChange={setFilesDialogOpen}>
          <DialogTrigger asChild>
            <Card className="cursor-pointer transition-all hover:shadow-md border-2 border-border hover:border-primary/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Upload className="size-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Subir Archivos</h3>
                  <p className="text-sm text-muted-foreground">
                    PDF, Word, imágenes y más
                  </p>
                </div>
                <Plus className="size-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Subir Archivos</DialogTitle>
              <DialogDescription>
                Arrastra archivos aquí o selecciona desde tu dispositivo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Drag & Drop Area */}
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileUpload(e.dataTransfer.files);
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() =>
                  document.getElementById('file-input-dialog')?.click()
                }
              >
                <Upload className="size-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </h3>
                <p className="text-muted-foreground">
                  Soporta PDF, Word, Excel, PowerPoint, imágenes y archivos de
                  texto
                </p>
              </div>

              <input
                id="file-input-dialog"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.xlsx,.xls,.ppt,.pptx"
              />

              {/* Quick Upload Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.pdf';
                    input.multiple = true;
                    input.onchange = (e) =>
                      handleFileUpload((e.target as HTMLInputElement).files);
                    input.click();
                  }}
                  className="h-12 flex-col gap-1"
                >
                  <FileText className="size-5 text-red-500" />
                  <span className="text-xs">PDF</span>
                </Button>

                <Dialog
                  open={documentDialogOpen}
                  onOpenChange={setDocumentDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-12 flex-col gap-1">
                      <FileText className="size-5 text-blue-500" />
                      <span className="text-xs">Documento</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Seleccionar tipo de documento</DialogTitle>
                      <DialogDescription>
                        Elige el tipo de documento que deseas subir
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.doc,.docx';
                          input.multiple = true;
                          input.onchange = (e) =>
                            handleFileUpload(
                              (e.target as HTMLInputElement).files,
                            );
                          input.click();
                          setDocumentDialogOpen(false);
                        }}
                        className="justify-start h-12"
                      >
                        <FileText className="size-5 text-blue-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Microsoft Word</div>
                          <div className="text-xs text-muted-foreground">
                            .doc, .docx
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.txt';
                          input.multiple = true;
                          input.onchange = (e) =>
                            handleFileUpload(
                              (e.target as HTMLInputElement).files,
                            );
                          input.click();
                          setDocumentDialogOpen(false);
                        }}
                        className="justify-start h-12"
                      >
                        <FileText className="size-5 text-gray-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Archivo de texto</div>
                          <div className="text-xs text-muted-foreground">
                            .txt
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.rtf';
                          input.multiple = true;
                          input.onchange = (e) =>
                            handleFileUpload(
                              (e.target as HTMLInputElement).files,
                            );
                          input.click();
                          setDocumentDialogOpen(false);
                        }}
                        className="justify-start h-12"
                      >
                        <FileText className="size-5 text-purple-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Rich Text Format</div>
                          <div className="text-xs text-muted-foreground">
                            .rtf
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.xlsx,.xls';
                          input.multiple = true;
                          input.onchange = (e) =>
                            handleFileUpload(
                              (e.target as HTMLInputElement).files,
                            );
                          input.click();
                          setDocumentDialogOpen(false);
                        }}
                        className="justify-start h-12"
                      >
                        <FileText className="size-5 text-green-600 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">Microsoft Excel</div>
                          <div className="text-xs text-muted-foreground">
                            .xlsx, .xls
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.ppt,.pptx';
                          input.multiple = true;
                          input.onchange = (e) =>
                            handleFileUpload(
                              (e.target as HTMLInputElement).files,
                            );
                          input.click();
                          setDocumentDialogOpen(false);
                        }}
                        className="justify-start h-12"
                      >
                        <FileText className="size-5 text-orange-500 mr-3" />
                        <div className="text-left">
                          <div className="font-medium">
                            Microsoft PowerPoint
                          </div>
                          <div className="text-xs text-muted-foreground">
                            .ppt, .pptx
                          </div>
                        </div>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.jpg,.jpeg,.png,.gif,.bmp';
                    input.multiple = true;
                    input.onchange = (e) =>
                      handleFileUpload((e.target as HTMLInputElement).files);
                    input.click();
                  }}
                  className="h-12 flex-col gap-1"
                >
                  <Image className="size-5 text-green-500" />
                  <span className="text-xs">Imagen</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.onchange = (e) =>
                      handleFileUpload((e.target as HTMLInputElement).files);
                    input.click();
                  }}
                  className="h-12 flex-col gap-1"
                >
                  <Plus className="size-5" />
                  <span className="text-xs">Otros</span>
                </Button>
              </div>

              {/* Uploaded Files */}
              {uploadedFiles.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">
                      Archivos seleccionados ({uploadedFiles.length})
                    </h4>
                    <div className="space-y-2">
                      {uploadedFiles.map((uploadedFile) => (
                        <div
                          key={uploadedFile.id}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          {getFileIcon(uploadedFile.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {uploadedFile.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(uploadedFile.file.size / 1024 / 1024).toFixed(
                                2,
                              )}{' '}
                              MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadedFile.id)}
                            className="size-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={loading || uploadedFiles.length === 0}
                className="w-full h-12 text-base"
                size="lg"
              >
                {loading ? 'Procesando...' : 'Añadir a la Base de Conocimiento'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Card
          className={`cursor-pointer transition-all hover:shadow-md border-2 ${
            uploadMode === 'manual'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setUploadMode('manual')}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="size-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <PenTool className="size-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">Escribir Texto</h3>
              <p className="text-sm text-muted-foreground">
                Crear documento manualmente
              </p>
            </div>
            <Plus className="size-4 text-muted-foreground ml-auto" />
          </CardContent>
        </Card>
      </div>

      {/* Content based on selected mode */}
      {uploadMode === 'manual' && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title-input"
                  className="text-sm font-medium mb-2 block"
                >
                  Título del documento
                </label>
                <Input
                  id="title-input"
                  placeholder="Ingresa el título..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="source-input"
                  className="text-sm font-medium mb-2 block"
                >
                  Fuente
                </label>
                <Input
                  id="source-input"
                  placeholder="Fuente del documento..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="content-input"
                  className="text-sm font-medium mb-2 block"
                >
                  Contenido
                </label>
                <Textarea
                  id="content-input"
                  placeholder="Escribe o pega el contenido del documento aquí..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
          {/* Submit Button for Manual Mode */}
          <CardContent className="pt-0">
            <Button
              onClick={handleSubmit}
              disabled={loading || !title || !content || !source}
              className="w-full h-12 text-base"
              size="lg"
            >
              {loading ? 'Procesando...' : 'Añadir a la Base de Conocimiento'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
