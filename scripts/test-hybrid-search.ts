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
import { db } from '@/lib/rag/db';
import { embeddings } from '@/lib/rag/db/schema/embeddings';
import { resources } from '@/lib/rag/db/schema/resources';

const sampleText = `
  El Internet, uno de los avances tecnológicos más significativos del siglo XX, transformó radicalmente la forma en que las personas interactúan, acceden a la información y hacen negocios. Sus orígenes se remontan a la década de 1960 con el desarrollo de ARPANET, una red experimental financiada por el Departamento de Defensa de los Estados Unidos. El propósito inicial de ARPANET era permitir la comunicación entre investigadores en diferentes universidades sin depender de una única línea de comunicación física.

Durante los años 70 y 80, se desarrollaron protocolos fundamentales como TCP/IP, que permitieron que múltiples redes se interconectaran y funcionaran como una sola. En 1989, Tim Berners-Lee propuso el sistema de hipertexto que daría origen a la World Wide Web, facilitando el acceso a información a través de navegadores. En la década de 1990, el Internet comenzó su expansión global. Empresas, gobiernos y particulares empezaron a conectarse, dando lugar a una economía digital.

El impacto del Internet en la sociedad ha sido profundo. En la educación, ha permitido el acceso masivo a cursos en línea, bibliotecas digitales y herramientas interactivas. En la economía, ha originado nuevas industrias, desde el comercio electrónico hasta el marketing digital, y ha transformado industrias tradicionales como el turismo, el transporte y la banca. También ha influido en la política, al facilitar la organización de movimientos sociales, la difusión de información y la vigilancia ciudadana.

Sin embargo, también ha traído desafíos: la desinformación, las violaciones a la privacidad, la adicción digital y la desigualdad en el acceso. A pesar de los esfuerzos por lograr una conectividad global, todavía hay más de 2.5 mil millones de personas sin acceso estable a Internet. El concepto de “brecha digital” refleja esta desigualdad, y es uno de los principales retos del siglo XXI.

En los últimos años, el surgimiento de tecnologías como la inteligencia artificial, el Internet de las cosas (IoT), y la computación en la nube ha vuelto al Internet aún más indispensable. La sociedad moderna depende del acceso constante a servicios digitales, desde la comunicación hasta la gestión de infraestructuras críticas.

En conclusión, el Internet no es solo una herramienta: es una infraestructura fundamental para el funcionamiento del mundo moderno. Su desarrollo y regulación determinarán gran parte del futuro social, económico y político de la humanidad.
`;

const searchQuery =
  '¿Cuál fue el rol del Departamento de Defensa de los Estados Unidos en el origen del Internet, y qué tecnología específica financió en sus primeras etapas?';

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
    console.log('\n[3/4] ✨ Re-rankeando con el Cross-Encoder...');
    let finalResults: any;
    try {
      const { rerankWithXenova } = await import('@/lib/rag/rerank');
      console.log('✅ Módulo de rerank cargado correctamente');
      finalResults = await rerankWithXenova(searchQuery, hybridResults);
      console.log(`✅ Reranking completado: ${finalResults.length} resultados`);
    } catch (rerankError) {
      console.error('❌ Error en el reranking:');
      console.error(rerankError);
      throw rerankError;
    }

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
      const context = topK.map((r: any) => r.text).join('\n\n');
      console.log(context);
      console.log('---------------------------------------\n');

      console.log('\n-- Scores de re-ranking --');
      finalResults.forEach((result: any, index: number) => {
        console.log(
          `${index + 1}. Score: ${result.rerankScore?.toFixed(4) ?? 'N/A'} | "${result.text.substring(0, 80)}..."`,
        );
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
