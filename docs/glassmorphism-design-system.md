# 🔮 Sistema de Diseño Glassmorphism

Este documento define el sistema de diseño glassmorphism implementado en el proyecto, asegurando consistencia visual y armonía en todos los componentes.

## 📋 Tabla de Contenidos
- [Filosofía de Diseño](#filosofía-de-diseño)
- [Valores Base](#valores-base)
- [Componentes](#componentes)
- [Patrones de Interacción](#patrones-de-interacción)
- [Ejemplos de Código](#ejemplos-de-código)
- [Guía de Implementación](#guía-de-implementación)

## 🎨 Filosofía de Diseño

El sistema glassmorphism se basa en crear elementos que simulan vidrio esmerilado con:
- **Transparencia sutil** para mostrar el fondo
- **Desenfoque intenso** para el efecto cristal
- **Bordes translúcidos** para definición suave
- **Sombras multicapa** para profundidad
- **Efectos de brillo** en interacciones

## ⚙️ Valores Base

### 🔵 Desenfoque (Backdrop Blur)
```css
backdrop-blur-[24px]  /* Efecto principal para todos los elementos */
backdrop-blur-[28px]  /* Solo para input principal (más intenso) */
```

### 🔵 Fondos Translúcidos
```css
/* Fondos base */
bg-white/[0.04] dark:bg-white/[0.03]  /* Estado normal */
bg-white/[0.08] dark:bg-white/[0.06]  /* Estado hover */

/* Fondos más intensos para elementos especiales */
bg-black/[0.12] dark:bg-black/[0.25]  /* Input principal */
```

### 🔵 Bordes
```css
/* Bordes base */
border border-white/[0.08] dark:border-white/[0.06]  /* Estado normal */
border-white/[0.12] dark:border-white/[0.10]         /* Estado hover */

/* Bordes internos de brillo */
border border-white/[0.10]  /* Efecto hover interno */
```

### 🔵 Sombras Principales
```css
/* Sombra base con brillo interno */
shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset]

/* Sombra hover más intensa */
hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)]

/* Sombra para input principal */
shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_1px_rgba(255,255,255,0.1)_inset]
```

### 🔵 Colores de Texto
```css
/* Texto principal */
text-white/[0.70] hover:text-white/[0.90]  /* Botones y elementos principales */
text-white/[0.75] hover:text-white/[0.95]  /* Opciones y elementos secundarios */

/* Iconos */
text-white/[0.65] group-hover:text-white/[0.85]  /* Iconos en botones */
```

## 🧩 Componentes

### 🔹 Botones Principales
```tsx
className="group relative flex items-center gap-2 px-4 py-2.5 h-auto rounded-full 
  backdrop-blur-[24px] 
  bg-white/[0.04] dark:bg-white/[0.03] 
  border border-white/[0.08] dark:border-white/[0.06] 
  hover:bg-white/[0.08] dark:hover:bg-white/[0.06] 
  hover:border-white/[0.12] dark:hover:border-white/[0.10] 
  shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] 
  hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] 
  text-white/[0.70] hover:text-white/[0.90]
  transition-all duration-300 ease-out 
  hover:scale-[1.02] active:scale-[0.98]"
```

### 🔹 Botones Circulares (Iconos)
```tsx
className="group relative p-2 rounded-full 
  backdrop-blur-[24px] 
  bg-white/[0.04] dark:bg-white/[0.03] 
  border border-white/[0.08] dark:border-white/[0.06] 
  hover:bg-white/[0.08] dark:hover:bg-white/[0.06] 
  shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] 
  hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] 
  text-white/[0.70] hover:text-white/[0.90]
  transition-all duration-300 ease-out 
  hover:scale-[1.05] active:scale-[0.95]"
```

### 🔹 Áreas de Contenido
```tsx
className="group relative py-2.5 px-3 rounded-lg 
  backdrop-blur-[24px] 
  bg-white/[0.04] dark:bg-white/[0.03] 
  border border-white/[0.08] dark:border-white/[0.06] 
  hover:bg-white/[0.08] dark:hover:bg-white/[0.06] 
  shadow-[0_4px_20px_rgba(0,0,0,0.15),0_1px_1px_rgba(255,255,255,0.05)_inset] 
  hover:shadow-[0_8px_32px_rgba(0,0,0,0.25)] 
  text-white/[0.75] hover:text-white/[0.95]
  transition-all duration-300 ease-out 
  hover:scale-[1.01] active:scale-[0.99] 
  cursor-pointer"
```

### 🔹 Input Principal (Textarea)
```tsx
className="w-full resize-none rounded-3xl px-4 py-3 
  backdrop-blur-[28px] 
  bg-black/[0.12] dark:bg-black/[0.25] 
  border border-white/[0.08] dark:border-white/[0.06] 
  focus:border-white/[0.15] dark:focus:border-white/[0.12] 
  shadow-[0_8px_32px_rgba(0,0,0,0.25),0_1px_1px_rgba(255,255,255,0.1)_inset] 
  text-white placeholder:text-white/50 
  focus:outline-none focus:ring-0 
  transition-all duration-300"
```

## 🎯 Patrones de Interacción

### 🔸 Efectos de Hover
Todos los elementos incluyen efectos de brillo internos:

```tsx
{/* Efecto de brillo en hover */}
<div className="absolute inset-0 rounded-full bg-gradient-to-br 
  from-white/[0.08] to-transparent opacity-0 
  group-hover:opacity-100 transition-opacity duration-300" />

{/* Borde interno de brillo (para elementos rectangulares) */}
<div className="absolute inset-0 rounded-lg border border-white/[0.10] 
  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
```

### 🔸 Escalado en Interacciones
```css
/* Botones principales */
hover:scale-[1.02] active:scale-[0.98]

/* Botones circulares */
hover:scale-[1.05] active:scale-[0.95]

/* Elementos de contenido */
hover:scale-[1.01] active:scale-[0.99]
```

### 🔸 Transiciones
```css
transition-all duration-300 ease-out  /* Para todos los elementos */
```

## 🚀 Animaciones

### 🔸 Tiempos de Animación
```tsx
// Transiciones principales entre vistas
transition={{ duration: 0.15 }}

// Delays entre elementos
transition={{ delay: 0.02 * index }}  // Para listas de elementos
```

### 🔸 Movimientos
```tsx
// Entrada/salida de vistas
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -20 }}
```

## 📝 Guía de Implementación

### ✅ Reglas Obligatorias

1. **Siempre usar `backdrop-blur-[24px]`** en elementos glassmorphism
2. **Incluir sombras con brillo interno** para profundidad
3. **Usar transiciones de 300ms** para consistency
4. **Implementar efectos de hover** con gradientes internos
5. **Mantener opacidades específicas** según el tipo de elemento
6. **Usar escalado sutil** en interacciones

### ✅ Estructura HTML Requerida

```tsx
<div className="group relative [elemento-base] [glassmorphism-classes]">
  {/* Contenido principal */}
  <span className="relative z-10">Contenido</span>
  
  {/* Efectos de brillo hover */}
  <div className="absolute inset-0 [border-radius] bg-gradient-to-br 
    from-white/[0.08] to-transparent opacity-0 
    group-hover:opacity-100 transition-opacity duration-300" />
    
  {/* Borde interno opcional */}
  <div className="absolute inset-0 [border-radius] border border-white/[0.10] 
    opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
</div>
```

### ❌ Errores Comunes a Evitar

- No usar `backdrop-blur-xl` genérico, siempre especificar `[24px]` o `[28px]`
- No omitir las sombras con brillo interno (`inset`)
- No usar opacidades diferentes a las especificadas
- No cambiar los tiempos de transición sin documentar
- No omitir los efectos de hover/grupo

### 🔄 Actualización de Componentes Existentes

Para convertir un componente al sistema glassmorphism:

1. **Reemplazar fondos sólidos** con `bg-white/[0.04] dark:bg-white/[0.03]`
2. **Agregar `backdrop-blur-[24px]`**
3. **Implementar sistema de sombras** con brillo interno
4. **Añadir efectos de hover** con gradientes
5. **Actualizar colores de texto** a las opacidades especificadas
6. **Incluir transiciones** de 300ms

## 🎨 Paleta de Colores Glassmorphism

### 🟦 Fondos
- `bg-white/[0.04]` - Normal light
- `bg-white/[0.03]` - Normal dark  
- `bg-white/[0.08]` - Hover light
- `bg-white/[0.06]` - Hover dark
- `bg-black/[0.12]` - Input light
- `bg-black/[0.25]` - Input dark

### 🟦 Bordes
- `border-white/[0.08]` - Normal light
- `border-white/[0.06]` - Normal dark
- `border-white/[0.12]` - Hover light
- `border-white/[0.10]` - Hover dark

### 🟦 Texto
- `text-white/[0.70]` - Normal principal
- `text-white/[0.90]` - Hover principal
- `text-white/[0.75]` - Normal secundario
- `text-white/[0.95]` - Hover secundario
- `text-white/[0.65]` - Iconos normal
- `text-white/[0.85]` - Iconos hover

---

**💡 Nota**: Este sistema está diseñado para funcionar tanto en modo claro como oscuro, con ajustes automáticos usando las variantes `dark:` de Tailwind CSS.

**🔄 Versión**: 1.0.0  
**📅 Última actualización**: 2024 