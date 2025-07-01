'use server';

import {
  type NewResourceParams,
  resources,
} from '@/lib/rag/db/schema/resources';
import { db } from '@/lib/rag/db';
import { generateEmbeddings } from '@/lib/rag/ai/embedding';
import { embeddings as embeddingsTable } from '@/lib/rag/db/schema/embeddings';
import { nanoid } from '@/lib/rag/utils';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export const createResource = async (input: NewResourceParams) => {
  try {
    const { content, source } = input;

    // 1. Use langchain to split the document into smaller, more precise chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 300,
      chunkOverlap: 50,
      separators: ['\n\n', '. '], // Split by paragraph, then by sentence
    });
    const chunks = await splitter.splitText(content);

    // 2. Create the main resource entry
    const [resource] = await db
      .insert(resources)
      .values({
        id: nanoid(),
        content: content, // Store the original, full content
        source: source,
      })
      .returning();

    if (!resource) {
      throw new Error('Failed to create resource entry in the database.');
    }

    // 3. Generate embeddings for each chunk and save them
    const embeddedChunks = await generateEmbeddings(chunks); // Assuming generateEmbeddings can take an array

    await db.insert(embeddingsTable).values(
      embeddedChunks.map((chunk) => ({
        id: nanoid(),
        resourceId: resource.id,
        content: chunk.content,
        embedding: chunk.embedding,
      })),
    );

    return `Resource processed successfully. ${embeddedChunks.length} chunks were created and embedded.`;
  } catch (error) {
    console.error('Error in createResource:', error);
    throw new Error(
      `Failed to process resource. ${
        error instanceof Error ? error.message : ''
      }`,
    );
  }
};
