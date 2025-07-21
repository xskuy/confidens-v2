#!/usr/bin/env python3
"""
Script de prueba simplificado para el cliente de Voyage AI
"""

import os
import logging
from dataclasses import dataclass
from typing import Optional, Union

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class VoyageConfig:
    """Configuración para Voyage AI"""

    api_key: str
    model: str = "voyage-3.5"
    embedding_dimension: int = 1024
    batch_size: int = 50
    input_type_document: str = "document"
    input_type_query: str = "query"

    def __post_init__(self):
        if not self.api_key:
            raise ValueError("VOYAGE_API_KEY es requerido")


class VoyageClient:
    """Cliente para generar embeddings con Voyage AI"""

    def __init__(self, config: VoyageConfig):
        """Inicializar cliente de Voyage AI"""
        import voyageai  # type: ignore

        self.config = config
        self.client = voyageai.Client(api_key=config.api_key)
        logger.info(f"Cliente Voyage AI inicializado con modelo: {config.model}")

    def generate_embeddings(
        self,
        texts: Union[str, list[str]],
        input_type: Optional[str] = None,
        batch_size: Optional[int] = None,
    ) -> list[list[float]]:
        """Generar embeddings para texto(s)"""
        # Normalizar input
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            raise ValueError("Se requiere al menos un texto")

        # Configurar parámetros
        input_type = input_type or self.config.input_type_document
        batch_size = batch_size or self.config.batch_size

        logger.info(
            f"Generando embeddings para {len(texts)} textos (tipo: {input_type})"
        )

        all_embeddings = []

        # Procesar en lotes
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            logger.debug(f"Procesando lote {i // batch_size + 1}: {len(batch)} textos")

            try:
                result = self.client.embed(
                    texts=batch,
                    model=self.config.model,
                    input_type=input_type,
                    output_dimension=self.config.embedding_dimension,
                    truncation=True,
                )

                all_embeddings.extend(result.embeddings)
                logger.debug(
                    f"Lote procesado exitosamente. Total tokens: {result.total_tokens}"
                )

            except Exception as e:
                logger.error(
                    f"Error al generar embeddings para lote {i // batch_size + 1}: {e}"
                )
                raise

        logger.info(
            f"Embeddings generados exitosamente: {len(all_embeddings)} vectores"
        )
        return all_embeddings

    def generate_document_embeddings(
        self, texts: Union[str, list[str]]
    ) -> list[list[float]]:
        """Generar embeddings optimizados para documentos"""
        return self.generate_embeddings(
            texts, input_type=self.config.input_type_document
        )

    def generate_query_embedding(self, query: str) -> list[float]:
        """Generar embedding optimizado para consultas"""
        embeddings = self.generate_embeddings(
            [query], input_type=self.config.input_type_query
        )
        return embeddings[0]

    def validate_connection(self) -> bool:
        """Validar conexión con Voyage AI"""
        try:
            test_result = self.client.embed(
                texts=["test"], model=self.config.model, input_type="document"
            )

            if (
                test_result.embeddings
                and len(test_result.embeddings[0]) == self.config.embedding_dimension
            ):
                logger.info("Conexión con Voyage AI validada exitosamente")
                return True
            else:
                logger.error("Respuesta inesperada de Voyage AI")
                return False

        except Exception as e:
            logger.error(f"Error validando conexión con Voyage AI: {e}")
            return False


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
        print(f"  Modelo: {config.model}")
        print(f"  Dimensión: {config.embedding_dimension}")
        print(f"  Batch size: {config.batch_size}")

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

        # Probar múltiples textos
        print("\n📦 Probando múltiples textos...")
        test_texts = [
            "Primer documento de prueba",
            "Segundo documento con más contenido",
            "Tercer documento para verificar el funcionamiento",
        ]

        batch_embeddings = client.generate_document_embeddings(test_texts)
        print(f"✅ Múltiples embeddings generados: {len(batch_embeddings)} vectores")

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
