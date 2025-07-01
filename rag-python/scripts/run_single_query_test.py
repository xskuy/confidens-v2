#!/usr/bin/env python3
"""
Script para ejecutar una única consulta de prueba en el sistema RAG
y ver los resultados detallados que se pasarían al modelo.
"""

import sys
import os
import torch

# Añadir la ruta raíz del proyecto para poder importar desde 'src'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.db import get_db_client, get_or_create_collections
from src.search.hybrid_search import hybrid_search, rerank
from src.search.bm25_search import create_bm25_searcher
from transformers import AutoTokenizer, AutoModelForSequenceClassification


def run_test():
    """Ejecuta la prueba con una consulta predefinida."""

    # --- 1. CONFIGURACIÓN ---
    QUERY = "¿Cómo se alinea su solución con las tres cualidades destacadas de Alloxentric (Eficiencia, Comunicación y Modularidad)?"

    print("🚀 Ejecutando prueba de consulta única...")
    print(f'📄 Consulta: "{QUERY}"')
    print("-" * 80)

    # --- 2. CARGAR MODELOS Y DATOS ---
    print("🤖 Cargando modelos y conectando a la base de datos...")
    try:
        db_path = "./db"
        client = get_db_client(path=db_path)
        resources_collection, embeddings_collection = get_or_create_collections(client)

        all_docs = embeddings_collection.get()
        if not all_docs["documents"]:
            print(
                "❌ Error: No hay documentos en la base de datos. Por favor, ingeste un documento primero."
            )
            return

        corpus_ids = all_docs["ids"]
        corpus_docs = all_docs["documents"]
        print(f"📚 Corpus cargado con {len(corpus_ids)} chunks.")

        bm25_model = create_bm25_searcher(corpus_docs)
        print("✅ Modelo BM25 listo.")

        RERANKER_MODEL_NAME = "BAAI/bge-reranker-large"
        DEVICE = "cpu"

        reranker_tokenizer = AutoTokenizer.from_pretrained(RERANKER_MODEL_NAME)
        reranker_model = AutoModelForSequenceClassification.from_pretrained(
            RERANKER_MODEL_NAME
        ).to(DEVICE)

        if reranker_tokenizer.pad_token is None:
            reranker_tokenizer.pad_token = reranker_tokenizer.eos_token
            reranker_model.resize_token_embeddings(len(reranker_tokenizer))

        print("✅ Modelo Reranker listo.")
        print("-" * 80)

    except Exception as e:
        print(f"❌ Error al cargar modelos o datos: {e}")
        return

    # --- 3. EJECUTAR BÚSQUEDA ---
    print("🔍 Realizando búsqueda híbrida y reranking...")

    # Parámetros de búsqueda
    k_final = 10
    min_sigmoid = 0.3
    max_per_doc = 5  # Aumentado para ver más resultados del mismo doc

    # Búsqueda híbrida
    fused_results = hybrid_search(
        query=QUERY,
        embeddings_collection=embeddings_collection,
        bm25_searcher=bm25_model,
        corpus_ids=corpus_ids,
        k_final=k_final * 2,  # Obtener más para el reranker
        group_by_doc=False,
    )

    # Reranking
    final_results = rerank(
        query=QUERY,
        docs_ids_scores=fused_results,
        reranker_model=reranker_model,
        reranker_tokenizer=reranker_tokenizer,
        collection=embeddings_collection,
        device=DEVICE,
        min_sigmoid=min_sigmoid,
        max_per_doc=max_per_doc,
    )
    print("✅ Búsqueda completada.")
    print("-" * 80)

    # --- 4. MOSTRAR RESULTADOS ---
    print(f"🏆 RESULTADOS FINALES ({len(final_results)} chunks encontrados)")

    if not final_results:
        print("No se encontraron resultados relevantes.")
        return

    context_parts = []
    for i, (doc_id, logit_score) in enumerate(final_results, 1):
        sigmoid_score = torch.sigmoid(torch.tensor(logit_score)).item()
        retrieved_doc = embeddings_collection.get(
            ids=[doc_id], include=["metadatas", "documents"]
        )
        content = retrieved_doc["documents"][0]
        metadata = retrieved_doc["metadatas"][0]
        resource_id = metadata.get("resource_id", "N/A")

        context_parts.append(content)

        print(f"\\n🥇 RESULTADO #{i}")
        print(f"  - ID del Chunk: {doc_id}")
        print(f"  - ID del Recurso: {resource_id}")
        print(f"  - Score (Sigmoid): {sigmoid_score:.4f}")
        print("  - Contenido del Chunk:")
        print("----------------------------------------")
        print(content)
        print("----------------------------------------")

    # --- 5. MOSTRAR CONTEXTO COMBINADO ---
    print("\\n\\n" + "=" * 80)
    print("📝 CONTEXTO COMBINADO FINAL (lo que le llegaría al modelo)")
    print("=" * 80)
    combined_context = "\\n\\n---\\n\\n".join(context_parts)
    print(combined_context)
    print("\\n" + "=" * 80)


if __name__ == "__main__":
    run_test()
