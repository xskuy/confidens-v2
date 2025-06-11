#!/usr/bin/env python3
"""
Script para listar documentos desde la API de Next.js.
Responde con JSON a stdout con la lista de documentos.
"""

import json
import sys
from db import get_db_client, get_or_create_collections


def main():
    try:
        # Configurar la base de datos
        db_path = "./db"
        client = get_db_client(path=db_path)
        resources_collection, embeddings_collection = get_or_create_collections(client)
        
        # Obtener todos los recursos
        all_resources = resources_collection.get()
        
        # Obtener el conteo de chunks por resource_id
        all_chunks = embeddings_collection.get()
        chunk_counts = {}
        for metadata in all_chunks['metadatas']:
            resource_id = metadata.get('resource_id')
            if resource_id:
                chunk_counts[resource_id] = chunk_counts.get(resource_id, 0) + 1
        
        # Formatear los datos de respuesta
        documents = []
        for i, resource_id in enumerate(all_resources['ids']):
            metadata = all_resources['metadatas'][i]
            document = all_resources['documents'][i]
            
            documents.append({
                'id': resource_id,
                'title': metadata.get('title', 'Untitled'),
                'author': metadata.get('author', 'Unknown'),
                'type': metadata.get('type', 'document'),
                'version': metadata.get('version', '1.0.0'),
                'source': metadata.get('source', 'unknown'),
                'created_at': metadata.get('created_at', ''),
                'content_preview': document[:200] + '...' if len(document) > 200 else document,
                'content_length': len(document),
                'chunks_count': chunk_counts.get(resource_id, 0)
            })
        
        # Responder con éxito
        response = {
            "success": True,
            "documents": documents,
            "total_resources": len(documents),
            "total_chunks": len(all_chunks['ids'])
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