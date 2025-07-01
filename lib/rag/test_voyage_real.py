#!/usr/bin/env python3
"""
Script para probar la conexión real con Voyage AI
"""

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

from config.settings import VoyageConfig
from core.voyage_client import VoyageClient


def test_voyage_installation() -> bool:
    """Verificar si voyageai está instalado"""
    try:
        import voyageai

        print("✅ Paquete voyageai está instalado")
        print(f"   Versión: {voyageai.__version__ if hasattr(voyageai, '__version__') else 'desconocida'}")
        return True
    except ImportError:
        print("❌ Paquete voyageai NO está instalado")
        print("   Instala con: uv pip install voyageai")
        return False


def test_voyage_config() -> Optional[VoyageConfig]:
    """Verificar configuración de Voyage"""
    api_key = os.getenv("VOYAGE_API_KEY")

    if not api_key:
        print("❌ VOYAGE_API_KEY no está configurada")
        print("   Configura con: export VOYAGE_API_KEY='tu_api_key'")
        return None

    print("✅ VOYAGE_API_KEY está configurada")
    print(f"   Key: {api_key[:8]}...{api_key[-4:] if len(api_key) > 12 else api_key}")

    try:
        config = VoyageConfig(api_key=api_key)
        print("✅ Configuración válida:")
        print(f"   Modelo: {config.model}")
        print(f"   Dimensión: {config.embedding_dimension}")
        print(f"   Batch size: {config.batch_size}")
        return config
    except Exception as e:
        print(f"❌ Error en configuración: {e}")
        return None


def test_voyage_client(config: VoyageConfig) -> bool:
    """Probar cliente de Voyage"""
    try:
        print("\n🔄 Creando cliente Voyage...")
        client = VoyageClient(config)
        print("✅ Cliente creado exitosamente")

        print("\n🔄 Probando conexión...")
        if client.validate_connection():
            print("✅ Conexión exitosa")

            # Probar embedding simple
            print("\n🔄 Generando embedding de prueba...")
            test_text = "Esta es una prueba del cliente Voyage AI"
            embedding = client.generate_query_embedding(test_text)

            print("✅ Embedding generado:")
            print(f"   Dimensión: {len(embedding)}")
            print(f"   Primeros 5 valores: {embedding[:5]}")
            print(f"   Tipo: {type(embedding[0])}")

            # Probar múltiples embeddings
            print("\n🔄 Probando múltiples embeddings...")
            texts = ["Primer documento de prueba", "Segundo documento de prueba", "Tercer documento de prueba"]
            embeddings = client.generate_document_embeddings(texts)
            print(f"✅ {len(embeddings)} embeddings generados")

            # Mostrar información del modelo
            print("\n📊 Información del modelo:")
            model_info = client.get_model_info()
            for key, value in model_info.items():
                print(f"   {key}: {value}")

            return True
        else:
            print("❌ Fallo en validación de conexión")
            return False

    except Exception as e:
        print(f"❌ Error en cliente: {e}")
        return False


def main():
    """Función principal"""
    print("🚀 Probando cliente Voyage AI\n")

    # 1. Verificar instalación
    if not test_voyage_installation():
        return

    print()

    # 2. Verificar configuración
    config = test_voyage_config()
    if not config:
        return

    # 3. Probar cliente
    success = test_voyage_client(config)

    print(f"\n{'=' * 50}")
    if success:
        print("🎉 ¡Todas las pruebas pasaron! El cliente Voyage funciona correctamente.")
    else:
        print("💥 Algunas pruebas fallaron. Revisa la configuración.")
    print(f"{'=' * 50}")


if __name__ == "__main__":
    main()
