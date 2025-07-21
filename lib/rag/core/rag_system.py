#!/usr/bin/env python3
"""
Sistema RAG completo - Integración de Voyage AI y Qdrant
"""

import logging
import uuid
from datetime import datetime
from typing import Any, List, Optional

from ..api.schemas import DocumentDetails
from ..config.settings import RAGConfig
from .qdrant_client import QdrantClient
from .voyage_client import VoyageClient

logger = logging.getLogger(__name__)


class RAGSystem:
    """Sistema RAG completo para procesamiento y búsqueda de documentos"""

    def __init__(self, config: RAGConfig):
        """
        Inicializar sistema RAG

        Args:
            config: Configuración completa del sistema RAG
        """
        self.config = config

        # Inicializar clientes
        self.voyage_client = VoyageClient(config.voyage)
        self.qdrant_client = QdrantClient(config.qdrant)

        logger.info("Sistema RAG inicializado")

    def initialize_database(self, force_recreate: bool = False) -> bool:
        """
        Inicializar base de datos vectorial

        Args:
            force_recreate: Si True, recrea la colección

        Returns:
            True si la inicialización fue exitosa
        """
        try:
            logger.info("Inicializando base de datos vectorial...")

            # Validar conexiones
            if not self.voyage_client.validate_connection():
                logger.error("Fallo en validación de conexión con Voyage AI")
                return False

            if not self.qdrant_client.validate_connection():
                logger.error("Fallo en validación de conexión con Qdrant")
                return False

            # Crear colección
            if not self.qdrant_client.create_collection(force_recreate=force_recreate):
                logger.error("Fallo al crear colección en Qdrant")
                return False

            logger.info("Base de datos vectorial inicializada exitosamente")
            return True

        except Exception as e:
            logger.error(f"Error inicializando base de datos: {e}")
            return False

    def add_documents(
        self,
        texts: list[str],
        metadata: Optional[list[dict[str, Any]]] = None,
        ids: Optional[list[str]] = None,
    ) -> bool:
        """
        Agregar documentos al sistema RAG

        Args:
            texts: Lista de textos a agregar
            metadata: Metadatos opcionales para cada documento
            ids: IDs opcionales para cada documento

        Returns:
            True si los documentos fueron agregados exitosamente
        """
        try:
            logger.info(f"Agregando {len(texts)} documentos al sistema RAG...")

            # Generar embeddings para los documentos
            logger.info("Generando embeddings...")
            embeddings = self.voyage_client.generate_document_embeddings(texts)

            if len(embeddings) != len(texts):
                logger.error("Error: número de embeddings no coincide con número de textos")
                return False

            # Agregar a la base de datos vectorial
            logger.info("Almacenando en base de datos vectorial...")
            success = self.qdrant_client.add_documents(
                texts=texts,
                embeddings=embeddings,
                metadata=metadata,
                ids=ids,
            )

            if success:
                logger.info(f"Documentos agregados exitosamente: {len(texts)} documentos")
            else:
                logger.error("Error agregando documentos a la base de datos")

            return success

        except Exception as e:
            logger.error(f"Error agregando documentos: {e}")
            return False

    def search(
        self,
        query: str,
        limit: int = 10,
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[dict[str, Any]] = None,
    ) -> list[dict[str, Any]]:
        """
        Buscar documentos similares a una consulta

        Args:
            query: Consulta de búsqueda
            limit: Número máximo de resultados
            score_threshold: Umbral mínimo de similitud
            filter_conditions: Condiciones de filtrado opcionales

        Returns:
            Lista de documentos encontrados con sus scores
        """
        try:
            logger.info(f"Buscando documentos para consulta: '{query[:50]}...'")

            # Generar embedding de la consulta
            query_embedding = self.voyage_client.generate_query_embedding(query)

            # Buscar en la base de datos vectorial
            results = self.qdrant_client.search(
                query_embedding=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
                filter_conditions=filter_conditions,
            )

            logger.info(f"Búsqueda completada: {len(results)} resultados encontrados")
            return results

        except Exception as e:
            logger.error(f"Error en búsqueda: {e}")
            return []

    def list_documents(self) -> List[DocumentDetails]:
        """Lists all unique documents in the Qdrant collection."""
        try:
            # Get all points in a single call with a larger limit
            points, _ = self.qdrant_client.scroll(
                limit=1000,  # Increased limit to reduce API calls
                with_payload=True,
                with_vectors=False,
            )

            unique_documents = {}
            for point in points:
                doc_id = point.payload.get("document_id")
                if not doc_id:
                    continue

                if doc_id not in unique_documents:
                    # Create a serializable payload from the first chunk
                    serializable_payload = {
                        k: v for k, v in point.payload.items() if isinstance(v, (str, int, float, bool, list, dict))
                    }
                    unique_documents[doc_id] = DocumentDetails(
                        id=doc_id,
                        payload={
                            **serializable_payload,
                            "chunks_count": 0,
                        },
                    )

                # Increment chunk count for the document
                unique_documents[doc_id].payload["chunks_count"] += 1

            return list(unique_documents.values())

        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []

    def delete_documents_by_ids(self, ids: list[str]) -> bool:
        """
        Eliminar documentos por sus IDs

        Args:
            ids: Lista de IDs de los documentos a eliminar

        Returns:
            True si la eliminación fue exitosa
        """
        try:
            return self.qdrant_client.delete_documents(ids)
        except Exception as e:
            logger.error(f"Error eliminando documentos por IDs: {e}")
            return False

    def delete_documents_by_metadata(self, filter_conditions: dict[str, Any]) -> bool:
        """
        Eliminar documentos por filtro de metadatos

        Args:
            filter_conditions: Diccionario con el filtro

        Returns:
            True si la eliminación fue exitosa
        """
        try:
            return self.qdrant_client.delete_by_metadata(filter_conditions)
        except Exception as e:
            logger.error(f"Error eliminando documentos por metadatos: {e}")
            return False

    def get_system_info(self) -> dict[str, Any]:
        """
        Obtener información del sistema RAG

        Returns:
            Diccionario con información del sistema
        """
        try:
            # Información de Voyage
            voyage_info = self.voyage_client.get_model_info()

            # Información de Qdrant
            qdrant_info = self.qdrant_client.get_collection_info()

            return {
                "voyage": voyage_info,
                "qdrant": qdrant_info,
                "status": "active",
            }

        except Exception as e:
            logger.error(f"Error obteniendo información del sistema: {e}")
            return {"status": "error", "error": str(e)}

    def process_document_chunks(
        self,
        chunks: list[dict[str, Any]],
        batch_size: Optional[int] = None,
        document_id: Optional[str] = None,
        author: Optional[str] = None,
    ) -> bool:
        """
        Procesa los chunks de un documento y los agrega al sistema RAG.

        Args:
            chunks: Lista de chunks, donde cada chunk es un diccionario
                    que debe contener 'text' y opcionalmente 'metadata'.
            batch_size: Tamaño del lote para procesar embeddings.
            document_id: ID único para asociar todos los chunks.
            author: Nombre del autor del documento.

        Returns:
            True si el procesamiento fue exitoso.
        """
        try:
            if not chunks:
                logger.warning("No se proporcionaron chunks para procesar.")
                return False

            processing_batch_size = batch_size or self.config.processing.batch_size
            doc_id = document_id or str(uuid.uuid4())
            doc_author = author or "Sistema"
            logger.info(f"Procesando {len(chunks)} chunks para el documento ID: {doc_id}")

            num_batches = (len(chunks) + processing_batch_size - 1) // processing_batch_size

            for i in range(num_batches):
                batch_start = i * processing_batch_size
                batch_end = batch_start + processing_batch_size
                batch_chunks = chunks[batch_start:batch_end]

                texts_to_embed = [chunk["text"] for chunk in batch_chunks]

                # Crear metadatos enriquecidos
                metadata_list = []
                for chunk in batch_chunks:
                    meta = chunk.get("metadata", {})
                    meta["document_id"] = doc_id

                    # Correctly get title from file_name inside metadata
                    title = meta.get("file_name", "Documento sin título")
                    meta["title"] = title

                    meta["author"] = doc_author  # Usar el autor proporcionado
                    meta["created_at"] = datetime.utcnow().isoformat()
                    metadata_list.append(meta)

                logger.info(f"Procesando lote {i + 1}/{num_batches}: {len(batch_chunks)} chunks")

                success = self.add_documents(
                    texts=texts_to_embed,
                    metadata=metadata_list,
                )

                if not success:
                    logger.error(f"Error procesando el lote {i + 1}")
                    return False

            logger.info("Procesamiento de chunks completado exitosamente")
            return True

        except Exception as e:
            logger.error(f"Error en el procesamiento de chunks: {e}")
            return False

    def semantic_search_with_context(
        self,
        query: str,
        limit: int = 5,
        context_window: int = 2,
    ) -> list[dict[str, Any]]:
        """
        Búsqueda semántica con contexto expandido

        Args:
            query: Consulta de búsqueda
            limit: Número de resultados principales
            context_window: Ventana de contexto (chunks adyacentes)

        Returns:
            Lista de resultados con contexto expandido
        """
        try:
            # Búsqueda inicial
            initial_results = self.search(query, limit=limit)

            if not initial_results:
                return []

            # Expandir contexto (implementación básica)
            # En una implementación completa, buscarías chunks adyacentes por página/sección
            expanded_results = []
            for result in initial_results:
                # Por ahora, solo agregamos el resultado original
                # En el futuro, se puede implementar búsqueda de contexto por página/sección
                expanded_result = {
                    **result,
                    "context_expanded": False,  # Indicador de que no se expandió
                }
                expanded_results.append(expanded_result)

            return expanded_results

        except Exception as e:
            logger.error(f"Error en búsqueda con contexto: {e}")
            return []

    def cleanup(self) -> bool:
        """
        Limpiar recursos del sistema

        Returns:
            True si la limpieza fue exitosa
        """
        try:
            logger.info("Limpiando recursos del sistema RAG...")
            # En el futuro, aquí se pueden cerrar conexiones, limpiar archivos temporales, etc.
            logger.info("Limpieza completada")
            return True
        except Exception as e:
            logger.error(f"Error en limpieza: {e}")
            return False


def create_rag_system(config: Optional[RAGConfig] = None) -> RAGSystem:
    """
    Crear sistema RAG con configuración

    Args:
        config: Configuración del sistema RAG (usa from_env() si es None)

    Returns:
        Sistema RAG configurado
    """
    if config is None:
        config = RAGConfig.from_env()

    return RAGSystem(config)
