# MAPora

Editor visual de mapas turísticos basado en navegador. Crea mapas con puntos, rutas, textos, formas e imágenes, personaliza estilos base (incluye OpenStreetMap y OpenTopoMap), y exporta tu trabajo. Todo se guarda localmente en el navegador (IndexedDB) con auto-guardado.

## Características

- **Mapa interactivo** con MapLibre GL y múltiples estilos base: Callejero, Satélite, Híbrido, Terreno, **OpenStreetMap (OSM)** y **OpenTopoMap**.
- **Capas** tipo Photoshop: organiza tus elementos en capas, colapsa/expande para ver u ocultar la lista, y controla la visibilidad de cada capa.
- **Elementos anidados**: dentro de cada capa verás sus puntos, rutas, textos, formas e imágenes; seleccionalos para abrir el panel de propiedades y centrar el mapa en ellos.
- **Herramientas de dibujo**: marcadores, rutas (líneas/polilíneas), texto, formas (polígonos) e imágenes georreferenciadas.
- **Búsqueda y geocodificación** (Nominatim) y **enrutamiento** (OSRM) integrados.
- **Undo/Redo** (deshacer/rehacer) con historial.
- **Auto-guardado** en `IndexedDB`: tu proyecto persiste entre sesiones y se restaura al abrir la app (o usa `Ctrl/Cmd + S` para guardar manualmente).
- **Landing page** con vista previa del mapa y acceso al editor.
- **Exportación** a PDF/imagen y archivo de proyecto `.mapora`.

## Stack técnico

- **React 19** + **TypeScript**
- **Vite 8** (build/dev)
- **MapLibre GL** para el mapa
- **Tailwind CSS v4**
- **Zustand** para el estado global
- **Vitest** + **jsdom** + **fake-indexeddb** para pruebas
- **Oxlint** para linting

## Requisitos

- Node.js 20+ (recomendado 22 LTS)
- npm

## Puesta en marcha

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:5173)
npm run dev

# Construir para producción (salida en dist/)
npm run build

# Previsualizar el build localmente
npm run preview

# Ejecutar pruebas
npm run test

# Lint
npm run lint
```

## Variables de entorno

Copia `.env.example` a `.env` y ajusta si es necesario. Todas son opcionales; si se dejan vacías se usan los valores por defecto.

| Variable             | Descripción                                   | Defecto                                |
| -------------------- | --------------------------------------------- | -------------------------------------- |
| `VITE_MAP_STYLE_URL` | URL de estilo de mapa base personalizado      | (vacío → estilos integrados)           |
| `VITE_ROUTING_URL`   | Endpoint de enrutamiento (OSRM)               | `https://router.project-osrm.org`      |
| `VITE_GEOCODING_URL` | Endpoint de geocodificación (Nominatim)       | `https://nominatim.openstreetmap.org`   |

## Estructura del proyecto

```
src/
  components/
    layout/        Header, Sidebar (capas), StatusBar
    map/           MapLibreMap y overlays (marcadores, rutas, formas, textos)
    welcome/       LandingPage y ReferenceMapPreview
  constants/       map-styles (estilos OSM/raster), markers
  hooks/           use-map-routes, use-map-shapes, use-auto-save, ...
  lib/             history, project-view, geocoding, routing
  services/        storage (IndexedDB), export, mapora-file
  stores/          editor, project, ui, map, map-actions (flyTo)
  types/           map (modelo de datos)
```

## Despliegue en Vercel

El proyecto es una SPA estática compilada con Vite. El enrutado usa **hash** (`#/editor`), por lo que **no requiere reglas de rewrite** en el servidor.

### Opción A: Importar repositorio (recomendada)

1. Sube este repo a GitHub/GitLab.
2. En Vercel, **New Project** → importa el repositorio.
3. Vercel detecta Vite automáticamente:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. (Opcional) Define las variables de entorno `VITE_*` en *Project Settings → Environment Variables*.
5. Despliega.

### Opción B: CLI

```bash
npm i -g vercel
vercel            # preview
vercel --prod     # producción
```

Se incluye un `vercel.json` que fija el comando de build, el directorio de salida y cabeceras de caché para los assets estáticos.

> Nota: los datos de los proyectos se guardan en el navegador del usuario (IndexedDB), no en el servidor. Cada visitante mantiene su propio estado local.

## Notas

- El archivo `dist/` y `node_modules/` están ignorados en `.gitignore`.
- Para REST API keys de servicios externos, usa variables `VITE_*` (quedan expuestas en el cliente) o mueve la lógica a funciones serverless si requiere secretos.
