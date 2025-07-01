#!/usr/bin/env python3
"""
Cliente para Qdrant - Manejo de base de datos vectorial
"""

import logging
import uuid
from typing import Any, Optional

# Import con manejo de errores
try:
    from qdrant_client import QdrantClient as QdrantClientBase
    from qdrant_client.models import (
        CollectionInfo,
        Distance,
        FieldCondition,
        Filter,
        MatchValue,
        PointStruct,
        SearchRequest,
        VectorParams,
    )
except ImportError:
    QdrantClientBase = None  # type: ignore

logger = logging.getLogger(__name__)


class QdrantClient:
    """Cliente para manejar operaciones con Qdrant"""

    def __init__(self, config: Any):
        """
        Inicializar cliente de Qdrant

        Args:
            config: Configuración de Qdrant
        """
        self.config = config
        if QdrantClientBase is None:
            raise ImportError("qdrant-client no está instalado. Instala con: uv pip install qdrant-client")

        self.client = QdrantClientBase(
            url=config.url,
            api_key=config.api_key,
            timeout=60.0,
        )
        self.collection_name = config.collection_name

        if config.api_key:
            logger.info(f"Cliente Qdrant inicializado para Cloud: {config.url}")
        else:
            logger.info(f"Cliente Qdrant inicializado para Local: {config.url}")

    def create_collection(self, force_recreate: bool = False) -> bool:
        """
        Crear colección en Qdrant

        Args:
            force_recreate: Si True, elimina y recrea la colección

        Returns:
            True si la colección fue creada o ya existe
        """
        try:
            # Verificar si la colección existe
            collections = self.client.get_collections()
            collection_exists = any(col.name == self.collection_name for col in collections.collections)

            if collection_exists and force_recreate:
                logger.info(f"Eliminando colección existente: {self.collection_name}")
                self.client.delete_collection(self.collection_name)
                collection_exists = False

            if not collection_exists:
                logger.info(f"Creando colección: {self.collection_name}")

                # Mapear métricas de distancia
                distance_map = {
                    "COSINE": Distance.COSINE,
                    "EUCLIDEAN": Distance.EUCLID,
                    "DOT": Distance.DOT,
                }

                distance = distance_map.get(self.config.distance_metric, Distance.COSINE)

                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.config.vector_size,
                        distance=distance,
                    ),
                )
                logger.info(f"Colección creada exitosamente: {self.collection_name}")
            else:
                logger.info(f"Colección ya existe: {self.collection_name}")

            return True

        except Exception as e:
            logger.error(f"Error creando colección: {e}")
            return False

    def add_documents(
        self,
        texts: list[str],
        embeddings: list[list[float]],
        metadata: Optional[list[dict[str, Any]]] = None,
        ids: Optional[list[str]] = None,
    ) -> bool:
        """
        Agregar documentos a la colección

        Args:
            texts: Lista de textos
            embeddings: Lista de embeddings correspondientes
            metadata: Metadatos opcionales para cada documento
            ids: IDs opcionales para cada documento

        Returns:
            True si los documentos fueron agregados exitosamente
        """
        try:
            if len(texts) != len(embeddings):
                raise ValueError("El número de textos debe coincidir con el número de embeddings")

            # Si no se proporcionan IDs o si los proporcionados no son UUIDs, generar nuevos.
            final_ids = []
            if ids:
                for doc_id in ids:
                    try:
                        uuid.UUID(str(doc_id))
                        final_ids.append(doc_id)
                    except ValueError:
                        new_id = str(uuid.uuid4())
                        logger.warning(f"ID '{doc_id}' no es un UUID válido. Se generó uno nuevo: {new_id}")
                        final_ids.append(new_id)
            else:
                final_ids = [str(uuid.uuid4()) for _ in texts]

            # Preparar metadatos por defecto
            if metadata is None:
                metadata = [{}] * len(texts)

            # Crear puntos para Qdrant
            points = []
            for i, (text, embedding, meta, doc_id) in enumerate(zip(texts, embeddings, metadata, final_ids)):
                # Combinar texto con metadatos
                payload = {
                    "text": text,
                    "index": i,
                    **meta,
                }

                point = PointStruct(
                    id=doc_id,
                    vector=embedding,
                    payload=payload,
                )
                points.append(point)

            # Insertar puntos en lotes
            batch_size = 100  # Qdrant recomienda lotes de ~100 puntos
            for i in range(0, len(points), batch_size):
                batch = points[i : i + batch_size]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch,
                )
                logger.debug(f"Lote {i // batch_size + 1} insertado: {len(batch)} documentos")

            logger.info(f"Documentos agregados exitosamente: {len(texts)} documentos")
            return True

        except Exception as e:
            logger.error(f"Error agregando documentos: {e}")
            return False

    def search(
        self,
        query_embedding: list[float],
        limit: int = 10,
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[dict[str, Any]] = None,
    ) -> list[dict[str, Any]]:
        """
        Buscar documentos similares

        Args:
            query_embedding: Embedding de la consulta
            limit: Número máximo de resultados
            score_threshold: Umbral mínimo de similitud
            filter_conditions: Condiciones de filtrado opcionales

        Returns:
            Lista de documentos encontrados con sus scores
        """
        try:
            # Preparar filtros si se proporcionan
            query_filter = None
            if filter_conditions:
                conditions = []
                for key, value in filter_conditions.items():
                    conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
                query_filter = Filter(must=conditions)

            # Realizar búsqueda
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                score_threshold=score_threshold,
                query_filter=query_filter,
            )

            # Formatear resultados
            results = []
            for scored_point in search_result:
                result = {
                    "id": scored_point.id,
                    "score": scored_point.score,
                    "text": scored_point.payload.get("text", ""),
                    "metadata": {k: v for k, v in scored_point.payload.items() if k not in ["text", "index"]},
                }
                results.append(result)

            logger.info(f"Búsqueda completada: {len(results)} resultados encontrados")
            return results

        except Exception as e:
            logger.error(f"Error en búsqueda: {e}")
            return []

    def get_collection_info(self) -> Optional[dict[str, Any]]:
        """
        Obtener información de la colección

        Returns:
            Información de la colección o None si hay error
        """
        try:
            info = self.client.get_collection(self.collection_name)
            return {
                "name": info.config.params.vectors.size if hasattr(info.config.params, "vectors") else "N/A",
                "vectors_count": info.vectors_count,
                "indexed_vectors_count": info.indexed_vectors_count,
                "points_count": info.points_count,
                "status": info.status,
            }
        except Exception as e:
            logger.error(f"Error obteniendo información de colección: {e}")
            return None

    def delete_documents(self, ids: list[str]) -> bool:
        """
        Eliminar documentos por ID

        Args:
            ids: Lista de IDs a eliminar

        Returns:
            True si los documentos fueron eliminados exitosamente
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=ids,
            )
            logger.info(f"Documentos eliminados: {len(ids)} documentos")
            return True
        except Exception as e:
            logger.error(f"Error eliminando documentos: {e}")
            return False

    def validate_connection(self) -> bool:
        """
        Validar conexión con Qdrant

        Returns:
            True si la conexión es exitosa
        """
        try:
            # Intentar obtener información de la colección específica
            self.client.get_collection(collection_name=self.collection_name)
            logger.info("Conexión con Qdrant y colección validadas exitosamente")
            return True
        except Exception as e:
            # Si la colección no existe, es un error esperado que manejamos luego.
            # Aquí, cualquier otro error (como 403 Forbidden) es un fallo de conexión.
            if "not found" in str(e).lower():
                logger.warning(f"Colección '{self.collection_name}' no encontrada, se creará después.")
                return True

            logger.error(f"Error validando conexión con Qdrant: {e}")
            return False

    def clear_collection(self) -> bool:
        """
        Limpiar todos los documentos de la colección

        Returns:
            True si la operación fue exitosa
        """
        try:
            # Eliminar todos los puntos de la colección
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(),  # Filtro vacío = todos los puntos
            )
            logger.info(f"Colección limpiada: {self.collection_name}")
            return True
        except Exception as e:
            logger.error(f"Error limpiando colección: {e}")
            return False


class QdrantClientError(Exception):
    """Excepción personalizada para errores del cliente Qdrant"""

    pass


def create_qdrant_client(url: str = "http://localhost:6333", collection_name: str = "documents") -> QdrantClient:
    """
    Crear cliente de Qdrant con configuración simple

    Args:
        url: URL del servidor Qdrant
        collection_name: Nombre de la colección

    Returns:
        Cliente de Qdrant configurado
    """
    from config.settings import QdrantConfig

    config = QdrantConfig(url=url, collection_name=collection_name)
    return QdrantClient(config)
