import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { encode } from 'gpt-3-encoder';

// Use text-embedding-3-small (1536 dimensions) which is compatible with HNSW index limits in pgvector
const embeddingModel = openai.embedding('text-embedding-3-small');

const CHUNK_SIZE = 200; // Target chunk size in tokens
const CHUNK_OVERLAP = 20; // Number of overlapping tokens between chunks

/**
 * Splits a long text into smaller chunks based on token size, with overlap.
 * It prioritizes splitting by paragraphs, then by sentences.
 * @param text The input text to be split.
 * @returns An array of text chunks.
 */
const generateChunks = (text: string): string[] => {
  if (!text.trim()) {
    return [];
  }

  // First, split the text into sentences
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [];
  const chunks: string[] = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;

    const sentenceTokens = encode(sentence).length;

    // If a single sentence is larger than the chunk size, split it
    if (sentenceTokens > CHUNK_SIZE) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
        currentTokens = 0;
      }
      // Simple split for oversized sentences
      const half = Math.floor(sentence.length / 2);
      chunks.push(sentence.substring(0, half));
      chunks.push(sentence.substring(half));
      continue;
    }

    // If adding the next sentence exceeds the chunk size, finalize the current chunk
    if (currentTokens + sentenceTokens > CHUNK_SIZE) {
      chunks.push(currentChunk);

      // Start the next chunk with an overlap
      const overlapSentences = chunks[chunks.length - 1]
        .split(' ')
        .slice(-CHUNK_OVERLAP)
        .join(' ');
      currentChunk = `${overlapSentences} ${sentence}`;
      currentTokens = encode(currentChunk).length;
    } else {
      currentChunk += `${currentChunk ? ' ' : ''}${sentence}`;
      currentTokens += sentenceTokens;
    }
  }

  // Add the last remaining chunk
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const { embedding } = await embed({
    model: embeddingModel,
    value: value,
  });
  return embedding;
};

export const generateEmbeddings = async (
  chunks: string[],
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: chunks,
  });
  return embeddings.map((e, i) => ({ content: chunks[i], embedding: e }));
};
