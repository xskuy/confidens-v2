#!/usr/bin/env python3
"""
Dependencias de la API de RAG
"""

import logging
from functools import lru_cache

from ..config.settings import RAGConfig
from ..core.rag_system import RAGSystem

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_rag_config() -> RAGConfig:
    """
    Carga la configuración del RAG desde el entorno.
    Usa caché para evitar recargar en cada request.
    """
    logger.info("Cargando configuración del RAG...")
    return RAGConfig.from_env()


@lru_cache(maxsize=1)
def get_rag_system() -> RAGSystem:
    """
    Obtiene una instancia singleton del sistema RAG.
    Usa caché para asegurar que solo se inicialice una vez.
    """
    logger.info("Inicializando el sistema RAG...")
    config = get_rag_config()
    rag_system = RAGSystem(config)
    # Opcional: inicializar la base de datos si es necesario al arrancar
    # rag_system.initialize_database()
    return rag_system
