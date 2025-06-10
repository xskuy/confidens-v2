/**
 * @fileoverview
 * This file contains the logic for performing vector-based semantic search.
 * This would typically involve a vector database like Pinecone, Weaviate, or pgvector.
 */

import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import { generateEmbedding } from '@/lib/rag/ai/embedding';
import type { SearchResult } from '@/lib/rag/types';
import { resources } from '@/lib/rag/db/schema/resources';

/**
 * Performs a vector-based semantic search using pgvector.
 *
 * @param query The search query string.
 * @param limit The maximum number of results to return.
 * @returns A promise that resolves to a list of search results.
 */
export async function search(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  // 1. Generate an embedding for the user's query.
  const queryEmbedding = await generateEmbedding(query);

  // 2. Query the database for the most similar embeddings using cosine distance.
  // The `<=>` operator calculates the cosine distance (0=identical, 2=opposite).
  // We subtract from 1 to get cosine similarity (1=identical, -1=opposite).
  const embeddingString = JSON.stringify(queryEmbedding);
  const cosineDistance = sql<number>`1 - (${embeddings.embedding} <=> ${embeddingString})`;

  const results = await db
    .select({
      id: embeddings.id,
      text: embeddings.content,
      source: resources.source,
      score: cosineDistance,
    })
    .from(embeddings)
    .innerJoin(resources, eq(embeddings.resourceId, resources.id))
    .orderBy(cosineDistance)
    .limit(limit);

  return results as SearchResult[];
}
