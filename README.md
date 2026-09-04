# MAPora

Editor visual de mapas turísticos basado en navegador. Crea mapas con puntos, rutas, textos, formas e imágenes, importa archivos GPX, personaliza estilos base (incluye OpenStreetMap y OpenTopoMap), y exporta tu trabajo. Todo se guarda localmente en el navegador (IndexedDB) con auto-guardado.

## Características

- **Mapa interactivo** con MapLibre GL y múltiples estilos base: Callejero, Satélite, Híbrido, Terreno, OpenStreetMap y Topográfico.
- **Base OpenStreetMap**: todos los estilos base utilizan datos de OpenStreetMap como fuente cartográfica.
- **Capas tipo Photoshop**: organiza tus elementos en capas con colapsar/expandir y control de visibilidad individual.
- **Elementos anidados**: dentro de cada capa verás sus puntos, rutas, textos, formas e imágenes; seleccionalos para abrir el panel de propiedades y centrar el mapa en ellos.
- **Herramientas de dibujo**: marcadores, rutas (líneas/polilíneas), texto, formas (polígonos) e imágenes georreferenciadas.
- **Nodos editables**: arrastra vértices de rutas y formas para ajustar su trazado directamente en el mapa. Selección múltiple con Shift+clic.
- **Importar GPX**: carga archivos GPX de Wikiloc u otros para editar rutas y waypoints directamente en el editor.
- **Rutas A-B**: calcula rutas entre dos puntos con enrutamiento OSRM; múltiples rutas simultáneas permitidas.
- **Nodos al dibujar**: Ctrl+Z durante dibujo elimina el último punto (como Illustrator).
- **Búsqueda y geocodificación** (Nominatim) con navegación por teclado.
- **Enrutamiento** (OSRM) con abort controller para cancelar peticiones lentas.
- **Undo/Redo** (deshacer/rehacer) con historial de hasta 100 entradas.
- **Historial de versiones**: guarda snapshots del proyecto y restaura versiones anteriores.
- **Guardar como**: duplica tu proyecto para crear variantes sin perder el original.
- **Auto-guardado** en IndexedDB: tu proyecto persiste entre sesiones y se restaura al abrir la app (o usa Ctrl+S para guardar manualmente).
- **Exportación** a PDF/imagen y archivo de proyecto `.mapora` (con validación y límite de 10 MB).
- **Atajos de teclado**: Ctrl+Z, Ctrl+S, Ctrl+E, Delete, Escape, y letras para herramientas (V, M, A, L, P, T, I). Pulsa `?` para ver la lista completa.
- **Landing page** con acceso rápido al editor.

## Stack técnico

- **React 19** + **TypeScript**
- **Vite 8** (build/dev)
- **MapLibre GL v6** para el mapa
- **OpenStreetMap** como base cartográfica
- **Tailwind CSS v4**
- **Zustand** para el estado global
- **Vitest** + **jsdom** + **fake-indexeddb** para pruebas
- **Oxlint** para linting

## Requisitos

- Node.js >= 22
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
    map/           MapLibreMap, NodeOverlay, SearchBar y overlays
    modals/        HelpModal, VersionHistoryModal, DuplicateProjectModal, ImageSourceModal
    panels/        PropertiesPanel (edición de elementos)
    ui/            ConfirmModal y componentes base
    welcome/       LandingPage
  constants/       map-styles (estilos OSM/raster), markers, map-constants
  hooks/           use-map-routes, use-map-shapes, use-history-recorder, use-keyboard-shortcuts, ...
  lib/             history, project-view, fit-all, layer-utils, geocoding, routing
  services/        storage (IndexedDB singleton), export, mapora-file, gpx
  stores/          editor, project, ui, map, map-actions (flyTo), version (snapshots)
  types/           map (modelo de datos)
```

## Despliegue en Vercel

El proyecto es una SPA estática compilada con Vite. El enrutado usa **hash** (`#/editor`) y se incluye un `vercel.json` con rewrite de fallback para soporte SPA.

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

### vercel.json

El archivo incluye:
- **Rewrite** SPA: todas las rutas sirven `index.html` (excepto assets estáticos).
- **Cabeceras de seguridad**: HSTS, CSP (`default-src 'self'`), X-Content-Type-Options, X-Frame-Options, Referrer-Policy.
- **Caché** de assets estáticos con `Cache-Control: public, max-age=31536000, immutable`.

> Nota: los datos de los proyectos se guardan en el navegador del usuario (IndexedDB), no en el servidor. Cada visitante mantiene su propio estado local.

## Accesibilidad

- Modales con focus trap, Escape para cerrar y restauración del foco al elemento que los abrió.
- Barra de búsqueda con navegación por teclado (flechas arriba/abajo, Enter).
- ARIA roles (`combobox`, `listbox`, `option`, `dialog`, `aria-modal`).

## Licencia de datos

Los datos cartográficos provienen de [OpenStreetMap](https://www.openstreetmap.org/) y están bajo la licencia [ODbL](https://opendatacommons.org/licenses/odbl/). MAPora es un software independiente que utiliza estos datos de forma abierta.

## Notas

- El archivo `dist/` y `node_modules/` están ignorados en `.gitignore`.
- Para REST API keys de servicios externos, usa variables `VITE_*` (quedan expuestas en el cliente) o mueve la lógica a funciones serverless si requiere secretos.
- Se recomienda Node.js 22+ (`engines` en `package.json`).
