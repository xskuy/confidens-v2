#!/usr/bin/env python3
"""
Script de prueba para verificar que las APIs funcionan correctamente.
"""

import json
import subprocess
import sys

def test_ingest():
    """Prueba la ingesta de un documento"""
    print("🧪 Probando ingesta de documento...")
    
    test_data = {
        "title": "Documento de Prueba",
        "content": "Este es un documento de prueba para verificar que la API de ingesta funciona correctamente. Contiene información sobre pruebas unitarias y testing.",
        "source": "test_script",
        "author": "Sistema de Pruebas"
    }
    
    try:
        result = subprocess.run(
            ['uv', 'run', 'python', 'api_ingest.py'],
            input=json.dumps(test_data),
            text=True,
            capture_output=True,
            timeout=60
        )
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            print(f"✅ Ingesta exitosa: {response.get('message')}")
            print(f"   Resource ID: {response.get('resource_id')}")
            print(f"   Chunks: {response.get('chunks_count')}")
            return True
        else:
            print(f"❌ Error en ingesta: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Excepción en ingesta: {e}")
        return False

def test_list():
    """Prueba el listado de documentos"""
    print("\n🧪 Probando listado de documentos...")
    
    try:
        result = subprocess.run(
            ['uv', 'run', 'python', 'api_list.py'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            docs_count = response.get('total_resources', 0)
            chunks_count = response.get('total_chunks', 0)
            print(f"✅ Listado exitoso: {docs_count} documentos, {chunks_count} chunks")
            
            # Mostrar algunos documentos si existen
            documents = response.get('documents', [])
            for i, doc in enumerate(documents[:2]):  # Mostrar solo los primeros 2
                print(f"   Doc {i+1}: {doc.get('title')} ({doc.get('chunks_count')} chunks)")
            
            return True
        else:
            print(f"❌ Error en listado: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Excepción en listado: {e}")
        return False

def test_search():
    """Prueba la búsqueda híbrida"""
    print("\n🧪 Probando búsqueda híbrida...")
    
    search_data = {
        "query": "documento de prueba testing",
        "k_final": 3,
        "min_sigmoid": 0.3
    }
    
    try:
        result = subprocess.run(
            ['uv', 'run', 'python', 'api_search.py'],
            input=json.dumps(search_data),
            text=True,
            capture_output=True,
            timeout=60
        )
        
        if result.returncode == 0:
            response = json.loads(result.stdout)
            results_count = response.get('total_results', 0)
            print(f"✅ Búsqueda exitosa: {results_count} resultados")
            
            # Mostrar algunos resultados
            results = response.get('results', [])
            for i, result in enumerate(results[:2]):  # Mostrar solo los primeros 2
                score = result.get('score', {})
                print(f"   Resultado {i+1}: Score {score.get('sigmoid', 0):.3f}")
                print(f"      Contenido: {result.get('content', '')[:100]}...")
            
            return True
        else:
            print(f"❌ Error en búsqueda: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Excepción en búsqueda: {e}")
        return False

def main():
    print("🚀 Iniciando pruebas de las APIs de RAG...")
    print("=" * 50)
    
    success_count = 0
    total_tests = 3
    
    # Ejecutar pruebas
    if test_ingest():
        success_count += 1
    
    if test_list():
        success_count += 1
    
    if test_search():
        success_count += 1
    
    # Resumen
    print("\n" + "=" * 50)
    print(f"📊 Resumen: {success_count}/{total_tests} pruebas exitosas")
    
    if success_count == total_tests:
        print("🎉 ¡Todas las APIs funcionan correctamente!")
        sys.exit(0)
    else:
        print("⚠️  Algunas pruebas fallaron. Revisar logs arriba.")
        sys.exit(1)

if __name__ == "__main__":
    main() 