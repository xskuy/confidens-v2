#!/usr/bin/env python3
"""
Cliente para Voyage AI - Manejo de embeddings
"""

import logging
from typing import Any, Optional, Union

# Import con manejo de errores
try:
    import voyageai  # type: ignore
except ImportError:
    voyageai = None  # type: ignore

logger = logging.getLogger(__name__)


class VoyageClient:
    """Cliente para generar embeddings con Voyage AI"""

    def __init__(self, config: Any):
        """
        Inicializar cliente de Voyage AI

        Args:
            config: Configuración de Voyage AI
        """
        self.config = config
        if voyageai is None:
            raise ImportError("voyageai no está instalado. Instala con: pip install voyageai")
        self.client = voyageai.Client(api_key=config.api_key)
        logger.info(f"Cliente Voyage AI inicializado con modelo: {config.model}")

    def generate_embeddings(
        self,
        texts: Union[str, list[str]],
        input_type: Optional[str] = None,
        batch_size: Optional[int] = None,
    ) -> list[list[float]]:
        """
        Generar embeddings para texto(s)

        Args:
            texts: Texto o lista de textos
            input_type: 'document', 'query' o None
            batch_size: Tamaño del lote (usa config.batch_size por defecto)

        Returns:
            Lista de embeddings (vectores)
        """
        # Normalizar input
        if isinstance(texts, str):
            texts = [texts]

        if not texts:
            raise ValueError("Se requiere al menos un texto")

        # Configurar parámetros
        input_type = input_type or self.config.input_type_document
        batch_size = batch_size or self.config.batch_size

        logger.info(f"Generando embeddings para {len(texts)} textos (tipo: {input_type})")

        all_embeddings = []

        # Procesar en lotes si es necesario
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
                logger.debug(f"Lote procesado exitosamente. Total tokens: {result.total_tokens}")

            except Exception as e:
                logger.error(f"Error al generar embeddings para lote {i // batch_size + 1}: {e}")
                raise VoyageClientError(f"Error generando embeddings: {e}") from e

        logger.info(f"Embeddings generados exitosamente: {len(all_embeddings)} vectores")
        return all_embeddings

    def generate_document_embeddings(self, texts: Union[str, list[str]]) -> list[list[float]]:
        """
        Generar embeddings optimizados para documentos

        Args:
            texts: Texto o lista de textos de documentos

        Returns:
            Lista de embeddings
        """
        return self.generate_embeddings(texts, input_type=self.config.input_type_document)

    def generate_query_embedding(self, query: str) -> list[float]:
        """
        Generar embedding optimizado para consultas

        Args:
            query: Texto de la consulta

        Returns:
            Embedding de la consulta
        """
        embeddings = self.generate_embeddings([query], input_type=self.config.input_type_query)
        return embeddings[0]

    def batch_process_texts(
        self,
        texts: list[str],
        input_type: str = "document",
        callback: Optional[Any] = None,
    ) -> list[list[float]]:
        """
        Procesar textos en lotes con callback opcional

        Args:
            texts: Lista de textos
            input_type: Tipo de input ('document' o 'query')
            callback: Función callback para progreso (opcional)

        Returns:
            Lista de embeddings
        """
        batch_size = self.config.batch_size
        total_batches = (len(texts) + batch_size - 1) // batch_size
        all_embeddings = []

        logger.info(f"Procesamiento en lotes: {len(texts)} textos, {total_batches} lotes")

        for i in range(0, len(texts), batch_size):
            batch_num = i // batch_size + 1
            batch = texts[i : i + batch_size]

            try:
                embeddings = self.generate_embeddings(batch, input_type=input_type)
                all_embeddings.extend(embeddings)

                if callback:
                    callback(batch_num, total_batches, len(embeddings))

                logger.debug(f"Lote {batch_num}/{total_batches} completado")

            except Exception as e:
                logger.error(f"Error en lote {batch_num}: {e}")
                # Continuar con el siguiente lote en caso de error
                continue

        return all_embeddings

    def get_model_info(self) -> dict[str, Any]:
        """
        Obtener información del modelo actual

        Returns:
            Diccionario con información del modelo
        """
        return {
            "model": self.config.model,
            "embedding_dimension": self.config.embedding_dimension,
            "batch_size": self.config.batch_size,
            "input_types": [
                self.config.input_type_document,
                self.config.input_type_query,
            ],
        }

    def validate_connection(self) -> bool:
        """
        Validar conexión con Voyage AI

        Returns:
            True si la conexión es exitosa
        """
        try:
            # Hacer una llamada de prueba
            test_result = self.client.embed(texts=["test"], model=self.config.model, input_type="document")

            if test_result.embeddings and len(test_result.embeddings[0]) == self.config.embedding_dimension:
                logger.info("Conexión con Voyage AI validada exitosamente")
                return True
            else:
                logger.error("Respuesta inesperada de Voyage AI")
                return False

        except Exception as e:
            logger.error(f"Error validando conexión con Voyage AI: {e}")
            return False


class VoyageClientError(Exception):
    """Excepción personalizada para errores del cliente Voyage"""

    pass


# Utilidades adicionales
def create_voyage_client(api_key: str, model: str = "voyage-3.5") -> VoyageClient:
    """
    Factory function para crear cliente Voyage con configuración simple

    Args:
        api_key: API key de Voyage AI
        model: Modelo a usar

    Returns:
        Cliente Voyage configurado
    """

    # Definición local de VoyageConfig para evitar imports
    class VoyageConfig:
        def __init__(self, api_key: str, model: str = "voyage-3.5"):
            self.api_key = api_key
            self.model = model
            self.embedding_dimension = 1024
            self.batch_size = 50
            self.input_type_document = "document"
            self.input_type_query = "query"

    config = VoyageConfig(api_key=api_key, model=model)
    return VoyageClient(config)


def batch_callback_progress(batch_num: int, total_batches: int, batch_size: int) -> None:
    """
    Callback simple para mostrar progreso

    Args:
        batch_num: Número del lote actual
        total_batches: Total de lotes
        batch_size: Tamaño del lote procesado
    """
    percentage = (batch_num / total_batches) * 100
    print(f"🚀 Progreso: {batch_num}/{total_batches} lotes ({percentage:.1f}%) - {batch_size} embeddings generados")
