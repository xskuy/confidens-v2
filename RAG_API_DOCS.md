# APIs de RAG con FastAPI + Chroma

Este documento describe las tres APIs RAG implementadas con **FastAPI** para máximo rendimiento, integradas con Next.js.

## 🏗️ **Arquitectura**

```
┌─────────────────┐    HTTP     ┌─────────────────┐    ChromaDB    ┌─────────────────┐
│   Next.js       │◄──────────► │   FastAPI       │◄─────────────► │   Chroma        │
│   (Puerto 3000) │             │   (Puerto 8000) │               │   Vector DB     │
└─────────────────┘             └─────────────────┘               └─────────────────┘
```

### **Características Clave:**
- ⚡ **Modelos en memoria** - Carga una sola vez al inicio
- 🚀 **Búsquedas ultra-rápidas** - 1-3 segundos vs 10-30 segundos
- 📖 **Documentación automática** - Swagger UI en `/docs`
- 🔄 **Hot reload** - Desarrollo rápido con auto-restart
- 🛡️ **Validación automática** - Pydantic schemas

## 🚀 **Inicio Rápido**

### **Opción 1: Script Automático (Recomendado)**
```bash
./start-dev.sh
```

### **Opción 2: Manual**
```bash
# Terminal 1: FastAPI
pnpm rag:dev

# Terminal 2: Next.js  
pnpm dev
```

### **URLs Disponibles:**
- 📱 **Next.js App**: http://localhost:3000
- 🐍 **FastAPI Server**: http://localhost:8000  
- 📖 **API Docs**: http://localhost:8000/docs
- 🧪 **Prueba RAG**: http://localhost:3000/rag-test

## 🚀 APIs Disponibles

### 1. **Insertar Documentos** - `POST /api/rag/documents`

Ingesta documentos en ChromaDB con chunking automático.

#### Request Body:
```json
{
  "title": "Mi Documento",
  "author": "Autor (opcional)",
  "content_type": "document",
  "version": "1.0.0",
  "content": "Contenido completo del documento...",
  "source": "origen_del_documento"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Successfully ingested document 'Mi Documento'",
  "resourceId": "uuid-del-recurso",
  "chunksCount": 5
}
```

#### Ejemplo con cURL:
```bash
curl -X POST http://localhost:3000/api/rag/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Historia de la IA",
    "content": "La inteligencia artificial es un campo de la informática...",
    "source": "ejemplo_api"
  }'
```

---

### 2. **Listar Documentos** - `GET /api/rag/documents/list`

Lista todos los documentos almacenados.

#### Response:
```json
{
  "success": true,
  "documents": [
    {
      "id": "uuid-del-documento",
      "title": "Mi Documento",
      "author": "Autor",
      "type": "document", 
      "version": "1.0.0",
      "source": "origen",
      "created_at": "2024-01-01T00:00:00Z",
      "content_preview": "Primeros 200 caracteres...",
      "content_length": 1500,
      "chunks_count": 5
    }
  ],
  "totalResources": 10,
  "totalChunks": 45
}
```

#### Ejemplo con cURL:
```bash
curl -X GET http://localhost:3000/api/rag/documents/list
```

---

### 3. **Borrar Documentos** - `DELETE /api/rag/documents/delete`

Borra un documento y todos sus chunks asociados de ChromaDB.

#### Request Body:
```json
{
  "resource_id": "uuid-del-documento"
}
```

#### Response:
```json
{
  "success": true,
  "message": "Successfully deleted document 'Mi Documento' and 5 chunks",
  "resourceId": "uuid-del-documento",
  "chunksDeleted": 5
}
```

#### Errores:
- `404 Not Found` - Si el documento no existe
- `500 Internal Server Error` - Error del servidor

#### Ejemplo con cURL:
```bash
curl -X DELETE http://localhost:3000/api/rag/documents/delete \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "documento-uuid-a-borrar"}'
```

---

### 4. **Búsqueda Híbrida** - `POST /api/rag/search`

Búsqueda híbrida (semántica + léxica) con reranking.

#### Request Body:
```json
{
  "query": "¿Qué es la inteligencia artificial?",
  "k_final": 10,
  "min_sigmoid": 0.5,
  "max_per_doc": 3,
  "group_by_doc": false
}
```

#### Response:
```json
{
  "success": true,
  "results": [
    {
      "id": "chunk-uuid",
      "content": "Contenido del chunk relevante...",
      "score": {
        "logit": 2.5,
        "sigmoid": 0.92
      },
      "metadata": {
        "resource_id": "document-uuid",
        "chunk_index": 0,
        "length": 400,
        "title": "Historia de la IA",
        "author": "Autor",
        "source": "ejemplo"
      }
    }
  ],
  "totalResults": 5,
  "context": "Contexto combinado de todos los chunks relevantes...",
  "query": "¿Qué es la inteligencia artificial?"
}
```

---

## 📡 **FastAPI Directo**

También puedes usar FastAPI directamente (sin Next.js):

### **Documentación Interactiva**
Visita http://localhost:8000/docs para la interfaz Swagger.

### **Endpoints FastAPI:**
- `POST /api/ingest` - Ingestar documento
- `GET /api/list` - Listar documentos
- `DELETE /api/delete` - Borrar documento
- `POST /api/search` - Búsqueda híbrida

### **Ejemplos Directos:**
```bash
# Búsqueda directa en FastAPI
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Cómo funciona la búsqueda semántica?",
    "k_final": 5
  }'

# Borrar documento directamente en FastAPI
curl -X DELETE http://localhost:8000/api/delete \
  -H "Content-Type: application/json" \
  -d '{
    "resource_id": "documento-uuid-a-borrar"
  }'
```

---

## 🔧 **Configuración**

### **Variables de Entorno**
Crea `.env.local` con:
```bash
# URL del servidor FastAPI (opcional)
RAG_API_URL=http://127.0.0.1:8000
```

### **Dependencias de Python**
```txt
torch
transformers
bm25s
numpy
chromadb
sentence-transformers
PyStemmer
langchain-text-splitters
scikit-learn
fastapi
uvicorn[standard]
pydantic
```

### **Scripts Disponibles**
```bash
# Desarrollo
pnpm rag:dev          # Solo FastAPI con hot-reload
pnpm dev              # Solo Next.js
./start-dev.sh        # Ambos servidores

# Producción
pnpm rag:server       # FastAPI modo producción

# Testing
pnpm rag:test         # Pruebas de Python
```

---

## ⚡ **Mejoras de Rendimiento**

### **Antes (Scripts individuales):**
- ❌ Modelos se cargan en cada request
- ❌ 10-30 segundos por búsqueda
- ❌ Alto uso de memoria

### **Ahora (FastAPI):**
- ✅ Modelos en memoria permanente
- ✅ 1-3 segundos por búsqueda
- ✅ Uso eficiente de memoria
- ✅ Escalabilidad mejorada

---

## 🔍 **Troubleshooting**

### **Error: "RAG server is not available"**
```bash
# Verificar que FastAPI esté corriendo
curl http://localhost:8000/

# Iniciar FastAPI manualmente
cd rag-python
uv run uvicorn main_server:app --reload --port 8000
```

### **Error: "ModuleNotFoundError"**
```bash
# Reinstalar dependencias
cd rag-python
uv pip install -r requirements.txt
```

### **Búsqueda lenta en primera consulta**
- Normal: Los modelos se cargan al inicio del servidor
- Siguientes búsquedas serán instantáneas

### **Puerto 8000 ocupado**
```bash
# Cambiar puerto en main_server.py o usar:
uv run uvicorn main_server:app --port 8001
```

---

## 🧪 **Testing**

### **Prueba Completa del Sistema**
```bash
# 1. Iniciar servidores
./start-dev.sh

# 2. Probar APIs Python
pnpm rag:test

# 3. Acceder a interfaz web
open http://localhost:3000/rag-test
```

### **Swagger UI**
Visita http://localhost:8000/docs para:
- ✅ Probar APIs interactivamente
- ✅ Ver schemas de datos
- ✅ Generar código de ejemplo

---

## 🚀 **Próximos Pasos**

1. **Configurar variables de entorno** en `.env.local`
2. **Ejecutar** `./start-dev.sh`
3. **Abrir** http://localhost:3000/rag-test
4. **Ingestar** algunos documentos
5. **Realizar** búsquedas híbridas
6. **Explorar** http://localhost:8000/docs

¡Disfruta de la velocidad de FastAPI! ⚡🚀 