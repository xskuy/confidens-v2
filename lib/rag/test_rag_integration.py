#!/usr/bin/env python3
"""
Script para probar la integración completa del sistema RAG
"""

import logging
import os
import sys
from typing import Optional

# Cargar variables de entorno desde .env.local en la raíz del proyecto
try:
    from dotenv import load_dotenv

    # Obtener la ruta de la raíz del proyecto (subir 2 niveles desde lib/rag/)
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_local_path = os.path.join(project_root, ".env.local")

    # Cargar .env.local desde la raíz del proyecto
    if os.path.exists(env_local_path):
        load_dotenv(env_local_path)
        print(f"🔧 Variables cargadas desde: {env_local_path}")
    else:
        print(f"⚠️  No se encontró .env.local en: {env_local_path}")

except ImportError:
    print("  python-dotenv no disponible, usando variables de entorno del sistema")

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config.settings import RAGConfig
from core.rag_system import RAGSystem

# Configurar logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def test_rag_system_initialization() -> Optional[RAGSystem]:
    """Probar inicialización del sistema RAG"""
    try:
        print("🚀 Inicializando sistema RAG...")

        # Crear configuración
        config = RAGConfig.from_env()
        print("✅ Configuración cargada:")
        print(f"   Voyage API Key: {'configurada' if config.voyage.api_key else 'NO configurada'}")
        print(f"   Qdrant URL: {config.qdrant.url}")
        print(f"   Colección: {config.qdrant.collection_name}")

        # Crear sistema RAG
        rag_system = RAGSystem(config)
        print("✅ Sistema RAG creado")

        return rag_system

    except Exception as e:
        print(f"❌ Error inicializando sistema RAG: {e}")
        return None


def test_database_initialization(rag_system: RAGSystem) -> bool:
    """Probar inicialización de la base de datos"""
    try:
        print("\n🔄 Inicializando base de datos...")

        # Inicializar base de datos (sin recrear por defecto)
        success = rag_system.initialize_database(force_recreate=False)

        if success:
            print("✅ Base de datos inicializada exitosamente")

            # Obtener información del sistema
            info = rag_system.get_system_info()
            print("📊 Información del sistema:")
            print(f"   Status: {info.get('status')}")
            print(f"   Voyage modelo: {info.get('voyage', {}).get('model')}")
            print(f"   Qdrant colección: {info.get('qdrant', {}).get('name', 'N/A')}")

            return True
        else:
            print("❌ Error inicializando base de datos")
            return False

    except Exception as e:
        print(f"❌ Error en inicialización de base de datos: {e}")
        return False


def test_document_ingestion(rag_system: RAGSystem) -> bool:
    """Probar ingesta de documentos de prueba"""
    try:
        print("\n🔄 Probando ingesta de documentos...")

        # Documentos de prueba
        test_documents = [
            "Python es un lenguaje de programación interpretado y de alto nivel.",
            "Machine Learning es una rama de la inteligencia artificial.",
            "Los embeddings son representaciones vectoriales de texto.",
            "Qdrant es una base de datos vectorial de código abierto.",
            "Voyage AI proporciona modelos de embeddings de alta calidad.",
        ]

        # Metadatos de prueba
        test_metadata = [
            {"topic": "programming", "difficulty": "beginner"},
            {"topic": "ai", "difficulty": "intermediate"},
            {"topic": "nlp", "difficulty": "intermediate"},
            {"topic": "database", "difficulty": "beginner"},
            {"topic": "ai", "difficulty": "advanced"},
        ]

        # Agregar documentos
        success = rag_system.add_documents(
            texts=test_documents,
            metadata=test_metadata,
        )

        if success:
            print(f"✅ {len(test_documents)} documentos agregados exitosamente")
            return True
        else:
            print("❌ Error agregando documentos")
            return False

    except Exception as e:
        print(f"❌ Error en ingesta de documentos: {e}")
        return False


def test_semantic_search(rag_system: RAGSystem) -> bool:
    """Probar búsqueda semántica"""
    try:
        print("\n🔄 Probando búsqueda semántica...")

        # Consultas de prueba
        test_queries = [
            "¿Qué es Python?",
            "Explícame sobre inteligencia artificial",
            "¿Cómo funcionan los vectores en NLP?",
            "Bases de datos para almacenar vectores",
        ]

        for i, query in enumerate(test_queries, 1):
            print(f"\n🔍 Consulta {i}: {query}")

            results = rag_system.search(query, limit=3, score_threshold=0.3)

            if results:
                print(f"   📋 {len(results)} resultados encontrados:")
                for j, result in enumerate(results, 1):
                    score = result.get("score", 0)
                    text = result.get("text", "")[:80]
                    metadata = result.get("metadata", {})
                    topic = metadata.get("topic", "N/A")

                    print(f"      {j}. Score: {score:.3f} | Topic: {topic}")
                    print(f"         Text: {text}...")
            else:
                print("   ❌ No se encontraron resultados")

        return True

    except Exception as e:
        print(f"❌ Error en búsqueda semántica: {e}")
        return False


def test_chunk_processing(rag_system: RAGSystem) -> bool:
    """Probar procesamiento de chunks enriquecidos"""
    try:
        print("\n🔄 Probando procesamiento de chunks...")

        # Simular chunks enriquecidos (como los que genera prepare_chunks.py)
        test_chunks = [
            {
                "type": "text",
                "text": "Este es el texto original del chunk",
                "enriched_text": "Sección: Introducción\n\nEste es el texto original del chunk con contexto adicional.",
                "page": 1,
                "block_id": "block_1",
                "parent": "section_1",
                "id": "chunk_1",
            },
            {
                "type": "heading",
                "text": "Título de Sección",
                "enriched_text": "Título de Sección",
                "page": 1,
                "block_id": "block_2",
                "section_path": "1",
                "id": "chunk_2",
            },
            {
                "type": "text",
                "text": "Otro párrafo de contenido importante",
                "enriched_text": "Sección: Título de Sección\n\nOtro párrafo de contenido importante con más contexto.",
                "page": 2,
                "block_id": "block_3",
                "parent": "section_1",
                "id": "chunk_3",
            },
        ]

        # Procesar chunks
        success = rag_system.process_document_chunks(test_chunks)

        if success:
            print(f"✅ {len(test_chunks)} chunks procesados exitosamente")

            # Probar búsqueda en los chunks procesados
            print("\n🔍 Probando búsqueda en chunks procesados...")
            results = rag_system.search("contenido importante", limit=2)

            if results:
                print(f"   📋 {len(results)} resultados encontrados:")
                for result in results:
                    print(f"      Score: {result.get('score', 0):.3f}")
                    print(f"      Página: {result.get('metadata', {}).get('page', 'N/A')}")
                    print(f"      Tipo: {result.get('metadata', {}).get('type', 'N/A')}")

            return True
        else:
            print("❌ Error procesando chunks")
            return False

    except Exception as e:
        print(f"❌ Error en procesamiento de chunks: {e}")
        return False


def main():
    """Función principal"""
    print("🚀 Probando integración completa del sistema RAG\n")

    # 1. Inicializar sistema
    rag_system = test_rag_system_initialization()
    if not rag_system:
        return

    # 2. Inicializar base de datos
    if not test_database_initialization(rag_system):
        return

    # 3. Probar ingesta de documentos
    if not test_document_ingestion(rag_system):
        return

    # 4. Probar búsqueda semántica
    if not test_semantic_search(rag_system):
        return

    # 5. Probar procesamiento de chunks
    if not test_chunk_processing(rag_system):
        return

    # 6. Información final del sistema
    print("\n📊 Estado final del sistema:")
    info = rag_system.get_system_info()
    if info.get("qdrant"):
        qdrant_info = info["qdrant"]
        print(f"   Documentos totales: {qdrant_info.get('points_count', 'N/A')}")
        print(f"   Vectores indexados: {qdrant_info.get('indexed_vectors_count', 'N/A')}")

    print(f"\n{'=' * 60}")
    print("🎉 ¡Todas las pruebas del sistema RAG pasaron exitosamente!")
    print("🔥 El sistema está listo para procesar documentos reales.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
