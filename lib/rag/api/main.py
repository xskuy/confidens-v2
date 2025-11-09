#!/usr/bin/env python3
"""
Punto de entrada principal para la API de RAG con FastAPI
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..pdf_extraction.pipeline import initialize_ocr
from .router import router as api_router

# Configuración del logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="API del Sistema RAG",
    description="Permite interactuar con el sistema de Retrieval-Augmented Generation.",
    version="0.1.0",
)


@app.on_event("startup")
async def startup_event():
    """Eventos a ejecutar al iniciar la aplicación."""
    logger.info("Iniciando la aplicación API de RAG...")
    # Inicializar el modelo OCR en segundo plano para no bloquear el inicio
    # Esto es útil si el modelo es grande y tarda en cargar.
    initialize_ocr()
    logger.info("Modelo OCR inicializado (si está disponible).")


# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir las rutas de la API
app.include_router(api_router, prefix="/api/rag", tags=["RAG"])


@app.get("/", tags=["Root"])
def read_root():
    """Punto de entrada principal que muestra un mensaje de bienvenida."""
    return {"message": "Bienvenido a la API del sistema RAG"}
