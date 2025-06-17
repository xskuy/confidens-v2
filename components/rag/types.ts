export interface Document {
  id: string;
  title: string;
  author: string;
  source: string;
  created_at: string;
  content_preview: string;
  chunks_count: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  statusMessage?: string;
}

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface SearchResult {
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

export interface UploadedFile {
  file: File;
  id: string;
  type: 'pdf' | 'doc' | 'image' | 'text' | 'other';
}
