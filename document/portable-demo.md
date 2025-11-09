# 🚀 Guía de Demo para Confidens v2

## 🎯 **3 Opciones Fáciles para Demo**

### **Opción 1: ngrok (Más Rápida) ⭐**
```bash
./demo-setup.sh
```

**✅ Ventajas:**
- Setup en 2 minutos
- URL pública temporal (ej: `https://abc123.ngrok-free.app`)
- Acceso desde cualquier lugar del mundo
- No requiere configuración adicional

**❌ Desventajas:**
- URL cambia cada vez que reinicias
- Versión gratuita tiene limitaciones de tráfico

---

### **Opción 2: Red Local (Más Estable)**
```bash
# Opción A: Script normal
./start-dev.sh

# Opción B: Con Docker
./docker-demo.sh
docker run -p 3000:3000 -p 8000:8000 --name confidens-demo confidens-demo
```

**✅ Ventajas:**
- Más rápido (sin latencia de túnel)
- URL estable con tu IP local
- No depende de servicios externos

**❌ Desventajas:**
- Solo funciona en la misma red WiFi
- Necesitas abrir puertos en firewall (si hay)

---

### **Opción 3: Portable con USB (Para Clientes)**
```bash
# Crear paquete portable
tar -czf confidens-demo.tar.gz . --exclude=node_modules --exclude=.git
```

**✅ Ventajas:**
- Completamente offline
- No depende de internet
- Profesional para presentaciones

**❌ Desventajas:**
- Requiere setup en cada computador
- Más tiempo de preparación

---

## 🚀 **Quick Start - Opción Recomendada**

### **Para Demo Rápida (ngrok):**
```bash
# 1. Ejecutar script
./demo-setup.sh

# 2. Obtener URL pública
# Salida: https://xyz123.ngrok-free.app

# 3. Compartir URL
# ¡Listo para demo!
```

### **Para Demo en Oficina (Red Local):**
```bash
# 1. Obtener tu IP
ipconfig getifaddr en0  # macOS
# o ip route get 1 | awk '{print $7}' # Linux

# 2. Iniciar servidores
./start-dev.sh

# 3. Compartir IP
# http://TU_IP:3000
```

---

## 📋 **Checklist Pre-Demo**

### **Antes de la presentación:**
- [ ] Verificar `.env.local` configurado
- [ ] Probar que ambos servidores inicien correctamente
- [ ] Preparar datos de ejemplo para RAG
- [ ] Probar funcionalidades clave:
  - [ ] Chat básico
  - [ ] Carga de documentos
  - [ ] Búsqueda RAG
  - [ ] Múltiples modelos de IA

### **Datos de prueba recomendados:**
```bash
# Crear carpeta de documentos de demo
mkdir demo-documents
echo "Este es un documento de ejemplo para probar RAG..." > demo-documents/ejemplo.txt
```

---

## 🔧 **Troubleshooting**

### **Error: Puerto ocupado**
```bash
# Encontrar qué usa el puerto
lsof -i :3000
lsof -i :8000

# Matar proceso
kill -9 <PID>
```

### **Error: Variables de entorno**
```bash
# Copiar ejemplo
cp .env.example .env.local

# Editar variables necesarias
nano .env.local
```

### **Error: Dependencias Python**
```bash
cd rag-python
uv pip install -r requirements.txt
```

---

## 🎨 **Personalización para Demo**

### **Cambiar puerto por defecto:**
```bash
# En package.json, cambiar:
"dev": "next dev --turbo -p 3001"

# Actualizar ngrok:
ngrok http 3001
```

### **Modo demo sin autenticación:**
```typescript
// middleware.ts - Comentar temporalmente
export default function middleware(request: NextRequest) {
  // return NextResponse.next(); // Desactivar auth para demo
}
```

---

## 📱 **URLs de Demo**

Una vez iniciado, tendrás:

- **🌐 App Principal**: `http://localhost:3000` o tu URL pública
- **🧪 Prueba RAG**: `http://localhost:3000/rag-test`
- **🐍 FastAPI Docs**: `http://localhost:8000/docs`
- **📊 Panel ngrok**: `http://localhost:4040` (solo si usas ngrok)

---

## 💡 **Tips para Presentación**

1. **Prepara el flow**: Login → Carga documento → Chat → RAG search
2. **Ten backup**: URL local + ngrok por si falla una
3. **Prueba conectividad**: Verifica que el cliente tenga acceso web
4. **Documenta APIs**: Usa `/docs` para mostrar endpoints disponibles
5. **Demo progresiva**: Empieza simple, luego muestra features avanzadas 