/**
 * @fileoverview
 * This script provides an end-to-end test for the RAG pipeline.
 * It performs the following steps:
 * 1. Defines a sample document to be indexed.
 * 2. Calls the `createResource` server action to process and embed the document.
 * 3. Defines a search query related to the document.
 * 4. Calls `hybridSearch` to retrieve relevant results.
 * 5. Prints the results to the console.
 *
 * To run this script, use the command: `pnpm test:rag`
 */

import { createResource } from '@/lib/rag/actions/resources';
import { hybridSearch } from '@/lib/rag';
import { rerankWithXenova } from '@/lib/rag/rerank';
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import { resources } from '@/lib/rag/db/schema/resources';

const sampleText = `
  La computación cuántica es un paradigma de computación fundamentalmente nuevo,
  basado en los principios de la mecánica cuántica. A diferencia de los ordenadores
  clásicos, que almacenan y procesan información en bits (0s o 1s), los ordenadores
  cuánticos utilizan cúbits o bits cuánticos.

  Un cúbit puede representar un 0, un 1, o ambos valores simultáneamente gracias a un
  fenómeno llamado superposición. Además, los cúbits pueden estar entrelazados,
  lo que significa que el estado de un cúbit puede depender instantáneamente del
  estado de otro, sin importar la distancia que los separe. Estos dos principios,
  superposición y entrelazamiento, son la base del inmenso poder de la
  computación cuántica.

  Uno de los algoritmos más famosos es el algoritmo de Shor, que puede factorizar
  números enteros grandes de manera exponencialmente más rápida que cualquier
  algoritmo clásico conocido. Esto tiene implicaciones profundas para la criptografía
  moderna, que se basa en la dificultad de la factorización.
`;

const searchQuery =
  '¿Qué son los cúbits y cómo se relacionan con la superposición?';

async function main() {
  console.log('--- Iniciando prueba del pipeline RAG ---');

  try {
    // 0. Limpiar base de datos antes del test
    console.log('\n[0/4] 🧹 Limpiando base de datos...');
    await db.delete(embeddings);
    await db.delete(resources);
    console.log('✅ Base de datos limpiada.');

    // 1. Ingestar el documento de prueba
    console.log('\n[1/4] 📚 Ingestando el documento de prueba...');
    const creationResult = await createResource({
      content: sampleText,
      source: 'computacion-cuantica-wiki.txt',
    });
    console.log(`✅ Resultado: ${creationResult}`);

    // 2. Realizar la búsqueda híbrida
    console.log(`\n[2/4] 🔍 Realizando búsqueda híbrida inicial...`);
    const hybridResults = await hybridSearch(searchQuery, {
      keywordWeight: 0.7, // un poco más alto para preguntas definitorias
      vectorWeight: 0.3,
      topK: 20,
    });
    console.log(
      `✅ Búsqueda híbrida inicial encontró ${hybridResults.length} resultados.`,
    );

    // 3. Re-rank con el Cross-Encoder
    console.log('\n[3/4] ✨ Re-rankeando con Cross-Encoder...');
    const finalResults = await rerankWithXenova(searchQuery, hybridResults);

    // 4. Show final, reranked results and prepare context for LLM
    console.log('\n[4/4] ✨ Resultados finales y re-rankeados:');
    if (finalResults.length === 0) {
      console.log(
        'No se encontraron resultados relevantes tras el re-ranking.',
      );
    } else {
      const topK = finalResults.slice(0, 5);
      console.log(
        `\n-- Contexto generado para el LLM (Top ${topK.length} pasajes) --`,
      );
      const context = topK.map((r) => r.text).join('\n\n');
      console.log(context);
      console.log('---------------------------------------\n');

      console.log('-- Desglose de todos los pasajes re-rankeados --');
      finalResults.forEach((result, index) => {
        console.log(`\n--- Pasaje #${index + 1} ---`);
        console.log(
          `🎯 Score (Cross-Encoder): ${result.rerankScore.toFixed(4)}`,
        );
        console.log(`💬 Texto: "${result.text}"`);
      });
    }
  } catch (error) {
    console.error('\n❌ Error durante la prueba del pipeline RAG:');
    if (error instanceof Error) {
      console.error(error.message);
      if ('cause' in error && error.cause) {
        console.error('\nCausa del error:');
        console.error(error.cause);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  } finally {
    console.log('\n--- Prueba finalizada ---');
  }
}

main();
