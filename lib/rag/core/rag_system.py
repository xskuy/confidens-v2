#!/usr/bin/env python3
"""
Sistema RAG completo - Integración de Voyage AI y Qdrant
"""

import logging
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
        all_points = []
        next_offset = None

        while True:
            # The scroll method returns a tuple: (list[Record], str | None)
            points, next_offset = self.qdrant_client.scroll(
                collection_name=self.config.QDRANT_COLLECTION_NAME,
                limit=250,  # Adjust limit as needed
                with_payload=True,
                with_vectors=False,
                offset=next_offset,
            )
            all_points.extend(points)
            if not next_offset:
                break

        unique_documents = {}
        for point in all_points:
            doc_id = point.payload.get("document_id")
            if doc_id and doc_id not in unique_documents:
                # Create a serializable payload, excluding non-serializable types
                serializable_payload = {
                    k: v for k, v in point.payload.items() if isinstance(v, (str, int, float, bool, list, dict))
                }
                unique_documents[doc_id] = DocumentDetails(id=doc_id, payload=serializable_payload)

        return list(unique_documents.values())

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
    ) -> bool:
        """
        Procesar chunks de documentos (con metadatos enriquecidos)

        Args:
            chunks: Lista de chunks con formato {text, metadata}
            batch_size: Tamaño del lote para procesamiento
            document_id: ID único del documento al que pertenecen los chunks

        Returns:
            True si el procesamiento fue exitoso
        """
        try:
            batch_size = batch_size or self.config.processing.batch_size

            logger.info(f"Procesando {len(chunks)} chunks en lotes de {batch_size}")

            # Procesar en lotes
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]

                # Extraer textos y metadatos
                texts = []
                metadata = []
                ids = []

                for j, chunk in enumerate(batch):
                    # Usar enriched_text si está disponible, sino text
                    text = chunk.get("enriched_text", chunk.get("text", ""))
                    if not text or len(text.strip()) < self.config.processing.min_chunk_length:
                        continue

                    texts.append(text)

                    # Preparar metadatos
                    meta = {
                        "page": chunk.get("page"),
                        "block_id": chunk.get("block_id"),
                        "type": chunk.get("type"),
                        "parent": chunk.get("parent"),
                        "original_text": chunk.get("text", ""),
                    }
                    if document_id:
                        meta["document_id"] = document_id

                    # Agregar otros metadatos si existen
                    for key in ["section_path", "bbox", "confidence"]:
                        if key in chunk:
                            meta[key] = chunk[key]

                    metadata.append(meta)

                    # Generar ID único
                    chunk_id = chunk.get("id", f"chunk_{i}_{j}")
                    ids.append(chunk_id)

                if texts:
                    # Agregar lote al sistema
                    success = self.add_documents(texts=texts, metadata=metadata, ids=ids)
                    if not success:
                        logger.error(f"Error procesando lote {i // batch_size + 1}")
                        return False

                    logger.info(f"Lote {i // batch_size + 1} procesado: {len(texts)} chunks")

            logger.info("Procesamiento de chunks completado exitosamente")
            return True

        except Exception as e:
            logger.error(f"Error procesando chunks: {e}")
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
