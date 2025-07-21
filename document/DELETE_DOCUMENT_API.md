# 🗑️ API de Borrado de Documentos

## 📋 **Resumen**

La nueva funcionalidad de borrado permite eliminar documentos completos de ChromaDB, incluyendo:

- ✅ El documento principal de la colección `resources`
- ✅ Todos los chunks asociados de la colección `embeddings`
- ✅ Actualización automática del modelo BM25
- ✅ Validación de existencia del documento
- ✅ Manejo de errores 404 y 500

---

## 🚀 **Uso**

### **1. Via Next.js API**

```bash
curl -X DELETE http://localhost:3000/api/rag/documents/delete \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "documento-uuid-a-borrar"}'
```

### **2. Via FastAPI Directa**

```bash
curl -X DELETE http://localhost:8000/api/delete \
  -H "Content-Type: application/json" \
  -d '{"resource_id": "documento-uuid-a-borrar"}'
```

### **3. Via Interfaz Web**

1. Ve a http://localhost:3000/rag-test
2. En la sección "Documentos en la Base de Datos"
3. Haz clic en el botón 🗑️ junto al documento que quieres borrar
4. Confirma el borrado en el diálogo

---

## 📡 **Especificación API**

### **Request**
```json
{
  "resource_id": "uuid-del-documento-a-borrar"
}
```

### **Response Exitosa (200)**
```json
{
  "success": true,
  "message": "Successfully deleted document 'Historia de la IA' and 5 chunks",
  "resourceId": "abc-123-def",
  "chunksDeleted": 5
}
```

### **Errores**

#### **404 - Documento No Encontrado**
```json
{
  "detail": "Document abc-123-def not found"
}
```

#### **400 - Campo Requerido Faltante**
```json
{
  "detail": "Missing required field: resource_id"
}
```

#### **500 - Error del Servidor**
```json
{
  "detail": "Error deleting document: [descripción del error]"
}
```

---

## 🔧 **Implementación Técnica**

### **Flujo de Borrado:**

1. **Validación** → Verificar que el documento existe
2. **Búsqueda** → Encontrar todos los chunks relacionados
3. **Borrado de Chunks** → Eliminar de la colección `embeddings`
4. **Borrado Principal** → Eliminar de la colección `resources`  
5. **Actualización BM25** → Regenerar índice de búsqueda léxica
6. **Respuesta** → Confirmar borrado exitoso

### **Seguridad:**
- ✅ Autenticación requerida en Next.js API
- ✅ Validación de campos obligatorios
- ✅ Confirmación de usuario antes del borrado
- ✅ Transaccional (falla completamente si hay error)

### **Rendimiento:**
- ⚡ Borrado en batch de chunks para eficiencia
- ⚡ Actualización asíncrona del modelo BM25
- ⚡ Logs detallados para debugging

---

## 🧪 **Ejemplos de Prueba**

### **JavaScript/TypeScript**
```typescript
const deleteDocument = async (resourceId: string) => {
  const response = await fetch('/api/rag/documents/delete', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resource_id: resourceId })
  });
  
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
};
```

### **Python**
```python
import requests

def delete_document(resource_id: str) -> dict:
    response = requests.delete(
        'http://localhost:8000/api/delete',
        json={'resource_id': resource_id}
    )
    response.raise_for_status()
    return response.json()
```

---

## ⚠️ **Consideraciones Importantes**

1. **Irreversible**: El borrado es permanente y no se puede deshacer
2. **Cascada**: Borra TODOS los chunks asociados al documento
3. **BM25**: Actualiza automáticamente el índice de búsqueda
4. **Concurrencia**: Puede fallar si otro proceso está modificando el documento
5. **Búsquedas**: Los resultados de búsqueda activos son limpiados automáticamente

---

## 📊 **Logs de Ejemplo**

```
2024-01-15 10:30:15 INFO     🗑️ Borrando documento: doc-abc-123
2024-01-15 10:30:15 INFO     📊 Encontrados 8 chunks para borrar
2024-01-15 10:30:15 INFO     🗑️ Borrados 8 chunks
2024-01-15 10:30:15 INFO     🗑️ Borrado documento principal: doc-abc-123
2024-01-15 10:30:16 INFO     ✅ Documento 'Historia de la IA' borrado exitosamente
```

---

**🎯 La funcionalidad de borrado está lista y funcional en el sistema RAG!** 