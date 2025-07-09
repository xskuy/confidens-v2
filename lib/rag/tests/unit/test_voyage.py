#!/usr/bin/env python3
"""
Script de prueba para el cliente de Voyage AI
"""

import os
import sys
import logging
from pathlib import Path  

# Añadir la ruta del proyecto al PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from lib.rag.config.settings import VoyageConfig
from lib.rag.core.voyage_client import VoyageClient, batch_callback_progress

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_voyage_client():
    """Probar el cliente de Voyage AI"""

    # Obtener API key desde variable de entorno
    api_key = os.getenv("VOYAGE_API_KEY")
    if not api_key:
        print("❌ Error: VOYAGE_API_KEY no está configurado")
        print("Configúralo con: export VOYAGE_API_KEY='tu_api_key'")
        return False

    try:
        # Crear configuración
        config = VoyageConfig(api_key=api_key, model="voyage-3.5", batch_size=10)

        # Crear cliente
        client = VoyageClient(config)

        print("🔍 Información del modelo:")
        model_info = client.get_model_info()
        for key, value in model_info.items():
            print(f"  {key}: {value}")

        # Validar conexión
        print("\n🔗 Validando conexión...")
        if not client.validate_connection():
            print("❌ Error: No se pudo conectar con Voyage AI")
            return False

        print("✅ Conexión exitosa")

        # Probar embedding de documento
        print("\n📄 Probando embedding de documento...")
        doc_text = "Esta es una prueba de embeddings para documentos usando Voyage AI."
        doc_embedding = client.generate_document_embeddings(doc_text)
        print(f"✅ Embedding generado: dimensión {len(doc_embedding[0])}")

        # Probar embedding de query
        print("\n🔍 Probando embedding de query...")
        query_text = "¿Cómo funciona Voyage AI?"
        query_embedding = client.generate_query_embedding(query_text)
        print(f"✅ Query embedding generado: dimensión {len(query_embedding)}")

        # Probar batch processing
        print("\n📦 Probando procesamiento en lotes...")
        test_texts = [
            "Primer documento de prueba",
            "Segundo documento con más contenido",
            "Tercer documento para verificar el batch processing",
            "Cuarto documento",
            "Quinto documento final",
        ]

        batch_embeddings = client.batch_process_texts(
            texts=test_texts, input_type="document", callback=batch_callback_progress
        )

        print(f"✅ Batch processing completado: {len(batch_embeddings)} embeddings")

        # Mostrar estadísticas
        print("\n📊 Estadísticas:")
        print(f"  Total embeddings generados: {len(batch_embeddings)}")
        print(f"  Dimensión de embeddings: {len(batch_embeddings[0])}")
        print(f"  Modelo usado: {config.model}")

        return True

    except Exception as e:
        logger.error(f"Error durante las pruebas: {e}")
        return False


def main():
    """Función principal"""
    print("🚀 Iniciando pruebas del cliente Voyage AI")
    print("=" * 50)

    success = test_voyage_client()

    print("\n" + "=" * 50)
    if success:
        print("✅ ¡Todas las pruebas pasaron exitosamente!")
        print("El cliente de Voyage AI está listo para usar.")
    else:
        print("❌ Algunas pruebas fallaron.")
        print("Revisa la configuración y vuelve a intentar.")


if __name__ == "__main__":
    main()
