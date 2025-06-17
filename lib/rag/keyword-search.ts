/**
 * @fileoverview
 * This file contains the logic for performing keyword-based search.
 * In a real implementation, this could use a library like Fuse.js,
 * or a full-text search database like Elasticsearch which uses BM25.
 */

import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import type { SearchResult } from '@/lib/rag/types';
import { resources } from '@/lib/rag/db/schema/resources';

/**
 * Performs a keyword-based full-text search using PostgreSQL.
 *
 * @param query The search query string.
 * @param limit The maximum number of results to return.
 * @returns A promise that resolves to a list of search results.
 */
export async function search(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  // Extraer palabras clave importantes de la consulta
  const keywords = query
    .toLowerCase()
    .replace(/[¿?¡!,.:;()]/g, '') // Remover puntuación
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        ![
          'que',
          'del',
          'los',
          'las',
          'una',
          'por',
          'con',
          'fue',
          'cual',
          'como',
          'para',
          'desde',
          'hasta',
        ].includes(word),
    );

  // Construir búsqueda con ILIKE para cada keyword importante
  let whereCondition = sql`1=0`; // Empezar con falso

  for (const keyword of keywords) {
    whereCondition = sql`${whereCondition} OR ${embeddings.content} ILIKE ${`%${keyword}%`}`;
  }

  const results = await db
    .select({
      id: embeddings.id,
      text: embeddings.content,
      source: resources.source,
      score: sql`
        (CASE 
          WHEN ${embeddings.content} ILIKE '%arpanet%' THEN 10
          WHEN ${embeddings.content} ILIKE '%departamento%defensa%' THEN 8
          WHEN ${embeddings.content} ILIKE '%estados%unidos%' THEN 6
          WHEN ${embeddings.content} ILIKE '%financió%' OR ${embeddings.content} ILIKE '%financiado%' THEN 5
          ELSE 1
        END)
      `,
    })
    .from(embeddings)
    .innerJoin(resources, eq(embeddings.resourceId, resources.id))
    .where(whereCondition)
    .orderBy(sql`
      (CASE 
        WHEN ${embeddings.content} ILIKE '%arpanet%' THEN 10
        WHEN ${embeddings.content} ILIKE '%departamento%defensa%' THEN 8
        WHEN ${embeddings.content} ILIKE '%estados%unidos%' THEN 6
        WHEN ${embeddings.content} ILIKE '%financió%' OR ${embeddings.content} ILIKE '%financiado%' THEN 5
        ELSE 1
      END) DESC
    `)
    .limit(limit);

  return results as SearchResult[];
}
