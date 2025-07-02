#!/usr/bin/env python3
"""
Orquestación del pipeline completo de procesamiento de documentos PDF.
Integra extracción de bloques y enriquecimiento de chunks para sistemas RAG.
"""

import logging
import uuid
from typing import Any

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

from .pdf_extraction.pipeline import extract_blocks

logger = logging.getLogger(__name__)


def run_full_pipeline_from_bytes(file_bytes: bytes, filename: str) -> tuple[str, list[dict[str, Any]]]:
    """
    Ejecuta el pipeline completo de procesamiento desde bytes de PDF.

    Args:
        file_bytes: Bytes del archivo PDF
        filename: Nombre del archivo para metadatos

    Returns:
        Tupla con (document_id, chunks_enriquecidos)

    Raises:
        ImportError: Si PyMuPDF no está disponible
        Exception: Si hay errores en el procesamiento
    """
    if fitz is None:
        raise ImportError("PyMuPDF (fitz) no está instalado. Instala con: uv pip install PyMuPDF")

    try:
        logger.info(f"Iniciando pipeline para {filename}")

        # 1. Generar ID único para el documento
        document_id = str(uuid.uuid4())

        # 2. Crear documento PyMuPDF desde bytes
        doc = fitz.open(stream=file_bytes, filetype="pdf")

        # 3. Extraer bloques estructurados del PDF
        logger.info("Extrayendo bloques del PDF...")
        blocks = extract_blocks(doc)
        doc.close()

        if not blocks:
            logger.warning("No se extrajeron bloques del PDF")
            return document_id, []

        # 4. Enriquecer chunks con contexto de sección
        logger.info(f"Enriqueciendo {len(blocks)} bloques...")
        enriched_chunks = enrich_chunks_with_context(blocks, document_id, filename)

        logger.info(f"Pipeline completado: {len(enriched_chunks)} chunks generados")
        return document_id, enriched_chunks

    except Exception as e:
        logger.error(f"Error en pipeline de {filename}: {e}")
        raise


def enrich_chunks_with_context(blocks: list[dict[str, Any]], document_id: str, filename: str) -> list[dict[str, Any]]:
    """
    Enriquece chunks con contexto de sección para mejorar búsqueda vectorial.

    Args:
        blocks: Lista de bloques extraídos del PDF
        document_id: ID único del documento
        filename: Nombre del archivo

    Returns:
        Lista de chunks enriquecidos listos para RAG
    """
    # Construir mapa de secciones (path -> título)
    section_map = {}
    for block in blocks:
        if block.get("type") == "heading" and "section_path" in block:
            section_map[block["section_path"]] = block["text"]

    enriched_chunks = []

    for block in blocks:
        # Saltar bloques vacíos o sin texto
        text = block.get("text", "").strip()
        if not text:
            continue

        # Obtener contexto de sección
        parent_path = block.get("parent")
        section_context = ""

        if parent_path and parent_path in section_map:
            section_title = section_map[parent_path]
            section_context = f"Sección: {section_title}\n\n"

        # Crear texto enriquecido
        enriched_text = f"{section_context}Contenido: {text}"

        # Crear chunk enriquecido
        chunk = {
            "text": text,
            "enriched_text": enriched_text,
            "metadata": {
                "document_id": document_id,
                "file_name": filename,
                "page": block.get("page"),
                "block_id": block.get("block_id"),
                "type": block.get("type", "text"),
                "parent": parent_path,
                "section_path": block.get("section_path"),
                "level": block.get("level"),
                "bbox": block.get("bbox"),
            },
        }

        # Limpiar metadatos nulos
        chunk["metadata"] = {k: v for k, v in chunk["metadata"].items() if v is not None}

        enriched_chunks.append(chunk)

    return enriched_chunks


def process_pdf_file(file_path: str) -> tuple[str, list[dict[str, Any]]]:
    """
    Procesa un archivo PDF desde el sistema de archivos.

    Args:
        file_path: Ruta al archivo PDF

    Returns:
        Tupla con (document_id, chunks_enriquecidos)
    """
    with open(file_path, "rb") as f:
        file_bytes = f.read()

    filename = file_path.split("/")[-1]
    return run_full_pipeline_from_bytes(file_bytes, filename)
