# RAG Python - Sistema de Búsqueda Híbrida

Sistema de Retrieval-Augmented Generation (RAG) en Python con ChromaDB, búsqueda híbrida BM25 + embeddings, y reranking con transformers.

## 📁 Estructura del Proyecto

```
rag-python/
├── src/                        # Código fuente principal
│   ├── api/                   # APIs para integración externa
│   │   ├── api_ingest.py     # API de ingesta de documentos
│   │   ├── api_list.py       # API de listado de documentos
│   │   └── api_search.py     # API de búsqueda híbrida
│   ├── search/               # Módulos de búsqueda
│   │   ├── hybrid_search.py  # Búsqueda híbrida y reranking
│   │   ├── bm25_search.py    # Implementación BM25
│   │   └── query.py          # Consultas básicas de embeddings
│   ├── database/             # Operaciones de base de datos
│   │   └── db.py            # Cliente ChromaDB y colecciones
│   └── ingestion/            # Ingesta de documentos
│       └── ingest.py        # Procesamiento y almacenamiento
├── scripts/                  # Scripts principales y ejemplos
│   ├── main.py              # Script principal de demostración
│   └── main_server.py       # Servidor FastAPI
├── tests/                    # Archivos de prueba
│   └── test_api.py          # Tests de las APIs
├── db/                       # Base de datos ChromaDB
├── requirements.txt          # Dependencias Python
└── README.md                # Este archivo
```

## 🚀 Instalación

### Prerrequisitos
- Python 3.8+
- `uv` (recomendado) o `pip`

### Dependencias
```bash
# Instalar dependencias con uv (recomendado)
uv pip install -r requirements.txt

# O con pip tradicional
pip install -r requirements.txt
```

## 📖 Uso

### 1. Script Principal (Demostración)
```bash
uv run python scripts/main.py
```

### 2. Servidor FastAPI
```bash
uv run python scripts/main_server.py
```
El servidor estará disponible en `http://localhost:8000` con documentación en `/docs`.

### 3. APIs de Línea de Comandos

#### Ingestar Documento
```bash
echo '{"title": "Mi Documento", "content": "Contenido del documento...", "source": "ejemplo"}' | uv run python src/api/api_ingest.py
```

#### Listar Documentos
```bash
uv run python src/api/api_list.py
```

#### Buscar Documentos
```bash
echo '{"query": "búsqueda de ejemplo", "k_final": 5}' | uv run python src/api/api_search.py
```

### 4. Ejecutar Tests
```bash
uv run python tests/test_api.py
```

## 🔧 Características

### Búsqueda Híbrida
- **BM25**: Búsqueda lexical tradicional
- **Embeddings**: Búsqueda semántica con modelos transformer
- **Fusión RRF**: Combinación inteligente de ambos resultados
- **Reranking**: Refinamiento con modelos cross-encoder

### Base de Datos
- **ChromaDB**: Base de datos vectorial persistente
- **Colecciones separadas**: Recursos y embeddings organizados
- **Metadatos estructurados**: Información rica sobre documentos

### APIs
- **FastAPI**: Servidor web moderno y rápido
- **CLI Scripts**: Herramientas de línea de comandos
- **JSON I/O**: Entrada y salida estructurada

## 📚 Módulos Principales

### `src.search`
- `hybrid_search.py`: Implementación de búsqueda híbrida con MMR
- `bm25_search.py`: Búsqueda BM25 con biblioteca bm25s
- `query.py`: Consultas básicas de embeddings

### `src.database`
- `db.py`: Cliente ChromaDB y gestión de colecciones

### `src.ingestion`
- `ingest.py`: Procesamiento y chunking de documentos

### `src.api`
- Scripts de API para integración con sistemas externos

## 🛠️ Desarrollo

### Estructura de Importaciones
Todos los archivos utilizan importaciones relativas para mantener la modularidad:

```python
# Desde scripts/
from src.search.hybrid_search import hybrid_search
from src.database.db import get_db_client

# Desde src/search/
from ..database.db import get_db_client
from .bm25_search import create_bm25_searcher
```

### Agregar Nuevas Funcionalidades
1. Crear módulos en las carpetas apropiadas (`src/search/`, `src/database/`, etc.)
2. Actualizar `__init__.py` con las exportaciones
3. Agregar tests en `tests/`
4. Actualizar documentación

## 📝 Configuración

### Modelos por Defecto
- **Embeddings**: Generados por ChromaDB (sentence-transformers)
- **Reranker**: `BAAI/bge-reranker-large`
- **Device**: CPU (cambiar a "cuda" para GPU)

### Parámetros de Búsqueda
- `k_final`: Número de resultados finales (default: 10)
- `min_sigmoid`: Umbral de relevancia (default: 0.5)
- `max_per_doc`: Máximo chunks por documento (default: 3)

## 🔍 Ejemplo de Uso Programático

```python
from src.database.db import get_db_client, get_or_create_collections
from src.search.hybrid_search import hybrid_search
from src.search.bm25_search import create_bm25_searcher

# Conectar a la base de datos
client = get_db_client()
resources_collection, embeddings_collection = get_or_create_collections(client)

# Crear buscador BM25
docs = embeddings_collection.get()
bm25_model = create_bm25_searcher(docs["documents"])

# Realizar búsqueda híbrida
results = hybrid_search(
    query="mi consulta",
    embeddings_collection=embeddings_collection,
    bm25_searcher=bm25_model,
    corpus_ids=docs["ids"],
    k_final=5
)
```

## 📄 Licencia

Este proyecto está bajo la licencia MIT. 