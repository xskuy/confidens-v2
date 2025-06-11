#!/usr/bin/env python3
"""
Script para ingestar documentos desde la API de Next.js.
Lee datos JSON desde stdin y responde con JSON a stdout.
"""

import json
import sys
import uuid
import datetime
from db import get_db_client, get_or_create_collections
from ingest import ingest_resource


def main():
    try:
        # Leer datos desde stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        
        # Validar campos requeridos
        required_fields = ['title', 'content', 'source']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ValueError(f"Missing required field: {field}")
        
        # Configurar la base de datos
        db_path = "./db"
        client = get_db_client(path=db_path)
        resources_collection, embeddings_collection = get_or_create_collections(client)
        
        # Contar documentos antes de la ingesta
        before_count = embeddings_collection.count()
        
        # Ingestar el documento
        resource_id = ingest_resource(
            resources_collection=resources_collection,
            embeddings_collection=embeddings_collection,
            title=data['title'],
            author=data.get('author', 'Unknown'),
            content_type=data.get('content_type', 'document'),
            version=data.get('version', '1.0.0'),
            content=data['content'],
            source=data['source'],
        )
        
        # Contar documentos después de la ingesta
        after_count = embeddings_collection.count()
        chunks_added = after_count - before_count
        
        # Responder con éxito
        response = {
            "success": True,
            "resource_id": resource_id,
            "chunks_count": chunks_added,
            "message": f"Successfully ingested document '{data['title']}'"
        }
        
        print(json.dumps(response))
        
    except Exception as e:
        # Responder con error
        response = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(response))
        sys.exit(1)


if __name__ == "__main__":
    main() 