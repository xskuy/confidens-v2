#!/usr/bin/env python3
"""
Pipeline para la ingesta de documentos JSONL enriquecidos en el sistema RAG.
"""

import argparse
import json
import logging
import os
import sys
from collections.abc import Generator

from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env.local en la raíz del proyecto
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"))
load_dotenv(dotenv_path=dotenv_path)

# Añadir la ruta del proyecto al sys.path para importar módulos del core
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from config.settings import RAGConfig
from core.rag_system import RAGSystem

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def read_jsonl(file_path: str) -> Generator[dict, None, None]:
    """Lee un archivo JSONL línea por línea."""
    with open(file_path, encoding="utf-8") as f:
        for line in f:
            yield json.loads(line)


def main(args):
    """Función principal para la ingesta de documentos."""
    if not os.path.exists(args.file_path):
        logging.error(f"El archivo no existe: {args.file_path}")
        return

    logging.info("🚀 Iniciando pipeline de ingesta...")

    # 1. Cargar configuración e inicializar sistema RAG
    try:
        config = RAGConfig.from_env()
        rag_system = RAGSystem(config)
        logging.info("✅ Sistema RAG inicializado.")
    except Exception as e:
        logging.error(f"❌ Error inicializando el sistema RAG: {e}")
        return

    # 2. (Opcional) Limpiar la colección si se especifica
    if args.clear_collection:
        logging.warning(f"🧹 Limpiando la colección '{rag_system.qdrant_client.collection_name}'...")
        if rag_system.qdrant_client.clear_collection():
            logging.info("✅ Colección limpiada exitosamente.")
        else:
            logging.error("❌ No se pudo limpiar la colección.")
            return

    # 3. Preparar datos para la ingesta
    source_filename = os.path.basename(args.file_path)
    logging.info(f"📄 Procesando archivo: {source_filename}")

    texts_to_embed = []
    metadata_list = []

    for chunk in read_jsonl(args.file_path):
        if "enriched_text" not in chunk or not chunk["enriched_text"]:
            logging.warning(f"Chunk omitido por no tener 'enriched_text': {chunk.get('block_id', 'N/A')}")
            continue

        texts_to_embed.append(chunk["enriched_text"])

        metadata = {
            "source_file": source_filename,
            "page": chunk.get("page"),
            "block_id": chunk.get("block_id"),
            "type": chunk.get("type"),
            "parent": chunk.get("parent"),
            "original_text": chunk.get("original_text", ""),
        }
        metadata_list.append(metadata)

    if not texts_to_embed:
        logging.warning("No se encontraron textos para ingestar en el archivo.")
        return

    logging.info(f"📊 {len(texts_to_embed)} chunks extraídos y listos para la ingesta.")

    # 4. Enviar datos al sistema RAG
    logging.info("🧠 Enviando datos al sistema RAG para generar embeddings y almacenar...")
    success = rag_system.add_documents(texts=texts_to_embed, metadata=metadata_list)

    if success:
        logging.info("🎉 ¡Ingesta completada exitosamente!")
    else:
        logging.error("❌ Ocurrió un error durante la ingesta de documentos.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pipeline de Ingesta para el Sistema RAG.")
    parser.add_argument(
        "--file",
        dest="file_path",
        required=True,
        help="Ruta al archivo JSONL enriquecido para ingestar.",
    )
    parser.add_argument(
        "--clear",
        dest="clear_collection",
        action="store_true",
        help="Limpia la colección en Qdrant antes de la ingesta.",
    )

    args = parser.parse_args()
    main(args)
