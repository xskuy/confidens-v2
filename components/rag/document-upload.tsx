'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, X } from 'lucide-react';
import type { UploadedFile } from './types';

interface DocumentUploadProps {
  onSubmit: (data: {
    files: UploadedFile[];
  }) => void;
  loading: boolean;
}

export function DocumentUpload({ onSubmit, loading }: DocumentUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validar que sea un PDF
    if (
      !file.type.includes('pdf') &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      alert('Solo se permiten archivos PDF');
      return;
    }

    const uploadedFileData: UploadedFile = {
      file,
      id: Math.random().toString(36).substr(2, 9),
      type: 'pdf',
    };

    setUploadedFile(uploadedFileData);
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = () => {
    if (uploadedFile) {
      onSubmit({
        files: [uploadedFile],
      });
      setUploadedFile(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Drag & Drop Area */}
        <div
          className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/20"
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById('pdf-input')?.click()}
        >
          <Upload className="size-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Arrastra un PDF aquí o haz clic para seleccionar
          </h3>
          <p className="text-muted-foreground">
            Solo se permite un archivo PDF a la vez
          </p>
        </div>

        <input
          id="pdf-input"
          type="file"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
          accept=".pdf,application/pdf"
        />

        {/* Uploaded File Preview */}
        {uploadedFile && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="size-6 text-red-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  className="size-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={loading || !uploadedFile}
          className="w-full h-12 text-base"
          size="lg"
        >
          {loading ? 'Procesando...' : 'Subir PDF a la Base de Conocimiento'}
        </Button>
      </CardContent>
    </Card>
  );
}
