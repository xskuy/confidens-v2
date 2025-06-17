"""
Módulo de base de datos para RAG.
Contiene funciones para conectar y manejar ChromaDB.
"""

from .db import get_db_client, get_or_create_collections

__all__ = [
    'get_db_client',
    'get_or_create_collections'
] 