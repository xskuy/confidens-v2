#!/usr/bin/env python3
"""
Script para realizar búsqueda híbrida desde la API de Next.js.
Lee datos JSON desde stdin y responde con JSON a stdout.
"""

import json
import sys
import os
import torch
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from src.database.db import get_db_client, get_or_create_collections
from src.search.hybrid_search import hybrid_search, rerank
from src.search.bm25_search import create_bm25_searcher
from transformers import AutoTokenizer, AutoModelForSequenceClassification


def main():
    try:
        # Leer datos desde stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        # Validar campos requeridos
        if 'query' not in data or not data['query']:
            raise ValueError("Missing required field: query")
        
        # Configurar la base de datos
        db_path = "./db"
        client = get_db_client(path=db_path)
        resources_collection, embeddings_collection = get_or_create_collections(client)
        
        # Verificar que hay documentos
        all_docs = embeddings_collection.get()
        if not all_docs['documents']:
            response = {
                "success": True,
                "results": [],
                "total_results": 0,
                "context": "",
                "message": "No documents found in the database"
            }
            print(json.dumps(response))
            return
        
        corpus_docs = all_docs["documents"]
        corpus_ids = all_docs["ids"]
        
        # Crear BM25 searcher
        bm25_model = create_bm25_searcher(corpus_docs)
        
        # Cargar modelo de reranking
        RERANKER_MODEL_NAME = "BAAI/bge-reranker-large"
        DEVICE = "cpu"  # Cambiar a "cuda" si tienes GPU
        
        reranker_tokenizer = AutoTokenizer.from_pretrained(RERANKER_MODEL_NAME)
        reranker_model = AutoModelForSequenceClassification.from_pretrained(
            RERANKER_MODEL_NAME
        ).to(DEVICE)
        
        # Configurar pad_token si es necesario
        if reranker_tokenizer.pad_token is None:
            reranker_tokenizer.pad_token = reranker_tokenizer.eos_token
            reranker_tokenizer.pad_token_id = reranker_tokenizer.eos_token_id
            reranker_model.resize_token_embeddings(len(reranker_tokenizer))
        
        # Parámetros de búsqueda
        query_text = data['query']
        k_final = data.get('k_final', 10)
        min_sigmoid = data.get('min_sigmoid', 0.5)
        max_per_doc = data.get('max_per_doc', 3)
        group_by_doc = data.get('group_by_doc', False)
        
        # Realizar búsqueda híbrida
        fused_results = hybrid_search(
            query=query_text,
            embeddings_collection=embeddings_collection,
            bm25_searcher=bm25_model,
            corpus_ids=corpus_ids,
            k_final=k_final,
            group_by_doc=group_by_doc,
        )
        
        # Reranking
        reranked_results = rerank(
            query=query_text,
            docs_ids_scores=fused_results,
            reranker_model=reranker_model,
            reranker_tokenizer=reranker_tokenizer,
            collection=embeddings_collection,
            device=DEVICE,
            min_sigmoid=min_sigmoid,
            max_per_doc=max_per_doc,
        )
        
        # Formatear resultados
        results = []
        context_parts = []
        
        for doc_id, score in reranked_results:
            # Obtener el documento y metadatos
            doc_data = embeddings_collection.get(ids=[doc_id])
            content = doc_data["documents"][0]
            metadata = doc_data["metadatas"][0]
            
            # Calcular sigmoid score
            sigmoid_score = torch.sigmoid(torch.tensor(score)).item()
            
            # Obtener información del recurso padre
            resource_id = metadata.get('resource_id')
            resource_info = {}
            if resource_id:
                try:
                    resource_data = resources_collection.get(ids=[resource_id])
                    if resource_data['documents']:
                        resource_metadata = resource_data['metadatas'][0]
                        resource_info = {
                            'title': resource_metadata.get('title', 'Untitled'),
                            'author': resource_metadata.get('author', 'Unknown'),
                            'source': resource_metadata.get('source', 'unknown'),
                        }
                except Exception:
                    pass
            
            result = {
                'id': doc_id,
                'content': content,
                'score': {
                    'logit': float(score),
                    'sigmoid': float(sigmoid_score)
                },
                'metadata': {
                    'resource_id': resource_id,
                    'chunk_index': metadata.get('chunk_index', 0),
                    'length': metadata.get('length', len(content)),
                    **resource_info
                }
            }
            
            results.append(result)
            context_parts.append(content)
        
        # Crear contexto combinado
        combined_context = "\n\n".join(context_parts)
        
        # Responder con éxito
        response = {
            "success": True,
            "results": results,
            "total_results": len(results),
            "context": combined_context,
            "query": query_text
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        # Responder con error
        response = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(response))
        sys.exit(1)


if __name__ == "__main__":
    main() 