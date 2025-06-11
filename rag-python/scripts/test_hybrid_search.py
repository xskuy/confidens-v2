#!/usr/bin/env python3
"""
Script interactivo para probar la búsqueda híbrida con datos existentes.
Permite evaluar la calidad de los resultados y ajustar parámetros.
"""

import sys
import os
import torch
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.database.db import get_db_client, get_or_create_collections
from src.search.hybrid_search import hybrid_search, rerank
from src.search.bm25_search import create_bm25_searcher, bm25_search
from transformers import AutoTokenizer, AutoModelForSequenceClassification


def load_models():
    """Carga todos los modelos necesarios"""
    print("🤖 Cargando modelos...")
    
    # Conectar a base de datos
    db_path = "./db"
    client = get_db_client(path=db_path)
    resources_collection, embeddings_collection = get_or_create_collections(client)
    
    # Cargar corpus
    all_docs = embeddings_collection.get()
    if not all_docs['documents']:
        print("❌ No hay documentos en la base de datos")
        return None
    
    corpus_docs = all_docs["documents"]
    corpus_ids = all_docs["ids"]
    print(f"📚 Cargados {len(corpus_docs)} documentos")
    
    # Crear BM25
    bm25_model = create_bm25_searcher(corpus_docs)
    
    # Cargar reranker
    RERANKER_MODEL_NAME = "BAAI/bge-reranker-large"
    DEVICE = "cpu"
    
    print(f"⏳ Cargando modelo de reranking: {RERANKER_MODEL_NAME}...")
    reranker_tokenizer = AutoTokenizer.from_pretrained(RERANKER_MODEL_NAME)
    reranker_model = AutoModelForSequenceClassification.from_pretrained(
        RERANKER_MODEL_NAME
    ).to(DEVICE)
    
    if reranker_tokenizer.pad_token is None:
        reranker_tokenizer.pad_token = reranker_tokenizer.eos_token
        reranker_tokenizer.pad_token_id = reranker_tokenizer.eos_token_id
        reranker_model.resize_token_embeddings(len(reranker_tokenizer))
    
    print("✅ Modelos cargados exitosamente")
    
    return {
        'resources_collection': resources_collection,
        'embeddings_collection': embeddings_collection,
        'corpus_docs': corpus_docs,
        'corpus_ids': corpus_ids,
        'bm25_model': bm25_model,
        'reranker_model': reranker_model,
        'reranker_tokenizer': reranker_tokenizer,
        'device': DEVICE
    }


def show_bm25_results(query, models, k=10):
    """Muestra solo resultados BM25"""
    print(f"\n🔍 Resultados BM25 para: '{query}'")
    print("=" * 60)
    
    bm25_results = bm25_search(
        searcher=models['bm25_model'],
        query=query,
        corpus_ids=models['corpus_ids'],
        k=k
    )
    
    for i, (doc_id, score) in enumerate(bm25_results[:k], 1):
        content = models['embeddings_collection'].get(ids=[doc_id])['documents'][0]
        print(f"{i}. Score BM25: {score:.4f}")
        print(f"   ID: {doc_id}")
        print(f"   Content: {content[:150]}...")
        print()


def show_vector_results(query, models, k=10):
    """Muestra solo resultados de embeddings"""
    print(f"\n🧠 Resultados Embeddings para: '{query}'")
    print("=" * 60)
    
    vector_results = models['embeddings_collection'].query(
        query_texts=[query],
        n_results=k
    )
    
    for i, (doc_id, distance) in enumerate(zip(vector_results['ids'][0], vector_results['distances'][0]), 1):
        content = vector_results['documents'][0][i-1]
        # Convertir distancia a similaridad (ChromaDB usa distancia coseno)
        similarity = 1 - distance
        print(f"{i}. Similaridad: {similarity:.4f} (Distancia: {distance:.4f})")
        print(f"   ID: {doc_id}")
        print(f"   Content: {content[:150]}...")
        print()


def show_available_documents(models):
    """Muestra todos los documentos disponibles en la base de datos"""
    print("\n📚 DOCUMENTOS DISPONIBLES EN LA BASE DE DATOS")
    print("=" * 80)
    
    # Obtener todos los recursos
    try:
        all_resources = models['resources_collection'].get()
        all_chunks = models['embeddings_collection'].get()
        
        if not all_resources['ids']:
            print("❌ No hay documentos en la base de datos")
            return
        
        # Contar chunks por recurso
        chunk_counts = {}
        for metadata in all_chunks['metadatas']:
            resource_id = metadata.get('resource_id')
            if resource_id:
                chunk_counts[resource_id] = chunk_counts.get(resource_id, 0) + 1
        
        print(f"📊 Total de recursos: {len(all_resources['ids'])}")
        print(f"📄 Total de chunks: {len(all_chunks['ids'])}")
        print()
        
        # Mostrar cada recurso
        for i, resource_id in enumerate(all_resources['ids'], 1):
            metadata = all_resources['metadatas'][i-1]
            content = all_resources['documents'][i-1]
            chunks_count = chunk_counts.get(resource_id, 0)
            
            print(f"📚 DOCUMENTO {i}")
            print(f"   🆔 ID: {resource_id}")
            print(f"   📖 Título: {metadata.get('title', 'Sin título')}")
            print(f"   ✍️  Autor: {metadata.get('author', 'Desconocido')}")
            print(f"   📝 Tipo: {metadata.get('type', 'documento')}")
            print(f"   🔢 Versión: {metadata.get('version', 'N/A')}")
            print(f"   📍 Fuente: {metadata.get('source', 'Desconocida')}")
            print(f"   📅 Creado: {metadata.get('created_at', 'N/A')}")
            print(f"   🧩 Chunks: {chunks_count}")
            print(f"   📏 Longitud: {len(content):,} caracteres")
            print(f"   📄 Vista previa: {content[:200]}...")
            print("-" * 80)
            
    except Exception as e:
        print(f"❌ Error al obtener documentos: {e}")


def show_document_chunks(models, resource_id):
    """Muestra todos los chunks de un documento específico"""
    print(f"\n🧩 CHUNKS DEL DOCUMENTO: {resource_id}")
    print("=" * 80)
    
    try:
        # Buscar todos los chunks de este recurso
        all_chunks = models['embeddings_collection'].get()
        resource_chunks = []
        
        for i, metadata in enumerate(all_chunks['metadatas']):
            if metadata.get('resource_id') == resource_id:
                resource_chunks.append({
                    'id': all_chunks['ids'][i],
                    'content': all_chunks['documents'][i],
                    'metadata': metadata
                })
        
        if not resource_chunks:
            print(f"❌ No se encontraron chunks para el recurso: {resource_id}")
            return
        
        # Ordenar por chunk_index si está disponible
        resource_chunks.sort(key=lambda x: x['metadata'].get('chunk_index', 0))
        
        print(f"📊 Total de chunks: {len(resource_chunks)}")
        print()
        
        for i, chunk in enumerate(resource_chunks, 1):
            metadata = chunk['metadata']
            print(f"🧩 CHUNK {i}")
            print(f"   🆔 ID: {chunk['id']}")
            print(f"   📍 Índice: {metadata.get('chunk_index', 'N/A')}")
            print(f"   📏 Longitud: {metadata.get('length', len(chunk['content']))} caracteres")
            print(f"   📄 Contenido:")
            print(f"   {chunk['content']}")
            print("-" * 80)
            
    except Exception as e:
        print(f"❌ Error al obtener chunks: {e}")


def show_hybrid_results(query, models, k_final=10, min_sigmoid=0.3, max_per_doc=3):
    """Muestra resultados de búsqueda híbrida completa"""
    print(f"\n🔥 Resultados Híbridos para: '{query}'")
    print(f"   Parámetros: k_final={k_final}, min_sigmoid={min_sigmoid}, max_per_doc={max_per_doc}")
    print("=" * 80)
    
    # Paso 1: Búsqueda híbrida (fusión RRF)
    print("📊 Paso 1: Fusión RRF (BM25 + Embeddings)")
    fused_results = hybrid_search(
        query=query,
        embeddings_collection=models['embeddings_collection'],
        bm25_searcher=models['bm25_model'],
        corpus_ids=models['corpus_ids'],
        k_final=k_final * 2,  # Más resultados para reranking
        group_by_doc=False,
    )
    
    print(f"   Resultados fusionados: {len(fused_results)}")
    for i, (doc_id, score) in enumerate(fused_results[:5], 1):
        content = models['embeddings_collection'].get(ids=[doc_id])['documents'][0]
        print(f"   {i}. RRF Score: {score:.4f} | ID: {doc_id}")
        print(f"      Content: {content[:100]}...")
    
    # Paso 2: Reranking
    print(f"\n🎯 Paso 2: Reranking con {models['reranker_model'].config.name_or_path}")
    reranked_results = rerank(
        query=query,
        docs_ids_scores=fused_results,
        reranker_model=models['reranker_model'],
        reranker_tokenizer=models['reranker_tokenizer'],
        collection=models['embeddings_collection'],
        device=models['device'],
        min_sigmoid=min_sigmoid,
        max_per_doc=max_per_doc,
    )
    
    print(f"\n🏆 RESULTADOS FINALES ({len(reranked_results)} resultados)")
    print("=" * 80)
    
    if not reranked_results:
        print("❌ No se encontraron resultados relevantes con el umbral actual")
        return
    
    for i, (doc_id, logit_score) in enumerate(reranked_results, 1):
        sigmoid_score = torch.sigmoid(torch.tensor(logit_score)).item()
        content = models['embeddings_collection'].get(ids=[doc_id])['documents'][0]
        metadata = models['embeddings_collection'].get(ids=[doc_id])['metadatas'][0]
        
        # Obtener info del recurso padre
        resource_id = metadata.get('resource_id')
        resource_title = "Desconocido"
        if resource_id:
            try:
                resource_data = models['resources_collection'].get(ids=[resource_id])
                if resource_data['metadatas']:
                    resource_title = resource_data['metadatas'][0].get('title', 'Desconocido')
            except:
                pass
        
        print(f"🥇 RESULTADO {i}")
        print(f"   📊 Logit: {logit_score:.4f} | Sigmoid: {sigmoid_score:.4f}")
        print(f"   🆔 Doc ID: {doc_id}")
        print(f"   📚 Recurso: {resource_title}")
        print(f"   📄 Chunk: {metadata.get('chunk_index', 0)}")
        print(f"   📝 Contenido: {content}")
        print("-" * 80)


def interactive_test(models):
    """Modo interactivo para probar consultas"""
    print("\n🎮 MODO INTERACTIVO")
    print("Comandos disponibles:")
    print("  - Tu consulta: búsqueda híbrida completa")
    print("  - bm25 <consulta>: solo resultados BM25")
    print("  - vector <consulta>: solo resultados embeddings")
    print("  - docs: mostrar documentos disponibles")
    print("  - chunks <resource_id>: mostrar chunks de un documento")
    print("  - config: cambiar parámetros")
    print("  - quit: salir")
    print("=" * 50)
    
    # Parámetros por defecto
    params = {
        'k_final': 10,
        'min_sigmoid': 0.3,
        'max_per_doc': 3
    }
    
    while True:
        try:
            user_input = input("\n💬 Tu consulta: ").strip()
            
            if not user_input:
                continue
            elif user_input.lower() == 'quit':
                break
            elif user_input.lower() == 'config':
                print(f"\nParámetros actuales:")
                print(f"  k_final: {params['k_final']}")
                print(f"  min_sigmoid: {params['min_sigmoid']}")
                print(f"  max_per_doc: {params['max_per_doc']}")
                
                try:
                    new_k = input(f"Nuevo k_final (actual: {params['k_final']}): ").strip()
                    if new_k:
                        params['k_final'] = int(new_k)
                    
                    new_sigmoid = input(f"Nuevo min_sigmoid (actual: {params['min_sigmoid']}): ").strip()
                    if new_sigmoid:
                        params['min_sigmoid'] = float(new_sigmoid)
                    
                    new_max = input(f"Nuevo max_per_doc (actual: {params['max_per_doc']}): ").strip()
                    if new_max:
                        params['max_per_doc'] = int(new_max)
                    
                    print("✅ Parámetros actualizados")
                except ValueError:
                    print("❌ Valores inválidos, manteniendo configuración anterior")
                
            elif user_input.startswith('bm25 '):
                query = user_input[5:]
                show_bm25_results(query, models)
            elif user_input.startswith('vector '):
                query = user_input[7:]
                show_vector_results(query, models)
            elif user_input.lower() == 'docs':
                show_available_documents(models)
            elif user_input.startswith('chunks '):
                resource_id = user_input[7:].strip()
                if resource_id:
                    show_document_chunks(models, resource_id)
                else:
                    print("❌ Debes especificar un resource_id: chunks <resource_id>")
            else:
                # Búsqueda híbrida completa
                show_hybrid_results(user_input, models, **params)
                
        except KeyboardInterrupt:
            print("\n👋 ¡Hasta luego!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")


def run_predefined_tests(models):
    """Ejecuta algunas consultas predefinidas para evaluar"""
    test_queries = [
        "¿Qué es el Internet y cómo surgió?",
        "protocolos TCP/IP y desarrollo de redes",
        "energías renovables y parques eólicos",
        "brecha digital y acceso a Internet",
        "Tim Berners-Lee y World Wide Web",
        "desafíos del Internet en la sociedad moderna"
    ]
    
    print("\n🧪 PRUEBAS PREDEFINIDAS")
    print("=" * 50)
    
    for i, query in enumerate(test_queries, 1):
        print(f"\n🔍 PRUEBA {i}/{len(test_queries)}")
        show_hybrid_results(query, models, k_final=5, min_sigmoid=0.4)
        
        if i < len(test_queries):
            input("\nPresiona Enter para continuar...")


def main():
    print("🚀 Test de Búsqueda Híbrida RAG")
    print("=" * 50)
    
    # Cargar modelos
    models = load_models()
    if not models:
        return
    
    while True:
        print("\n🎯 ¿Qué quieres hacer?")
        print("1. Pruebas predefinidas")
        print("2. Modo interactivo")
        print("3. Ver documentos disponibles")
        print("4. Salir")
        
        choice = input("\nSelecciona una opción (1-4): ").strip()
        
        if choice == '1':
            run_predefined_tests(models)
        elif choice == '2':
            interactive_test(models)
        elif choice == '3':
            show_available_documents(models)
        elif choice == '4':
            print("👋 ¡Hasta luego!")
            break
        else:
            print("❌ Opción inválida")


if __name__ == "__main__":
    main() 