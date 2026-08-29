import { create } from 'zustand'
import type { MapProject, MapLayer, MapMarker, MapRoute, MapText, MapShape, MapImage } from '@/types/map'

interface ProjectState {
  project: MapProject | null
  projects: MapProject[]
  lastSaved: string | null
  setProject: (project: MapProject | null) => void
  setProjects: (projects: MapProject[]) => void
  updateProject: (updates: Partial<MapProject>) => void
  addLayer: (layer: MapLayer) => void
  updateLayer: (id: string, updates: Partial<MapLayer>) => void
  removeLayer: (id: string) => void
  addMarker: (marker: MapMarker) => void
  updateMarker: (id: string, updates: Partial<MapMarker>) => void
  removeMarker: (id: string) => void
  addRoute: (route: MapRoute) => void
  updateRoute: (id: string, updates: Partial<MapRoute>) => void
  removeRoute: (id: string) => void
  addText: (text: MapText) => void
  updateText: (id: string, updates: Partial<MapText>) => void
  removeText: (id: string) => void
  addShape: (shape: MapShape) => void
  updateShape: (id: string, updates: Partial<MapShape>) => void
  removeShape: (id: string) => void
  addImage: (image: MapImage) => void
  updateImage: (id: string, updates: Partial<MapImage>) => void
  removeImage: (id: string) => void
  setLastSaved: (time: string) => void
}

const defaultLayerId = 'layer-default'
const defaultLayers: MapLayer[] = [
  { id: defaultLayerId, name: 'Capa principal', visible: true, locked: false, order: 0, type: 'markers' },
]

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  projects: [],
  lastSaved: null,
  setProject: (project) => set({ project }),
  setProjects: (projects) => set({ projects }),
  updateProject: (updates) =>
    set((state) => ({
      project: state.project ? { ...state.project, ...updates } : null,
    })),
  addLayer: (layer) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, layers: [...state.project.layers, layer] }
        : null,
    })),
  updateLayer: (id, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            layers: state.project.layers.map((l) =>
              l.id === id ? { ...l, ...updates } : l
            ),
          }
        : null,
    })),
  removeLayer: (id) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            layers: state.project.layers.filter((l) => l.id !== id),
            markers: state.project.markers.filter((m) => m.layerId !== id),
            routes: state.project.routes.filter((r) => r.layerId !== id),
            texts: state.project.texts.filter((t) => t.layerId !== id),
            shapes: state.project.shapes.filter((s) => s.layerId !== id),
            images: state.project.images.filter((i) => i.layerId !== id),
          }
        : null,
    })),
  addMarker: (marker) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, markers: [...state.project.markers, marker] }
        : null,
    })),
  updateMarker: (id, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            markers: state.project.markers.map((m) =>
              m.id === id ? { ...m, ...updates } : m
            ),
          }
        : null,
    })),
  removeMarker: (id) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            markers: state.project.markers.filter((m) => m.id !== id),
          }
        : null,
    })),
  addRoute: (route) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, routes: [...state.project.routes, route] }
        : null,
    })),
  updateRoute: (id, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            routes: state.project.routes.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          }
        : null,
    })),
  removeRoute: (id) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            routes: state.project.routes.filter((r) => r.id !== id),
          }
        : null,
    })),
  addText: (text) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, texts: [...state.project.texts, text] }
        : null,
    })),
  updateText: (id, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            texts: state.project.texts.map((t) =>
              t.id === id ? { ...t, ...updates } : t
            ),
          }
        : null,
    })),
  removeText: (id) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            texts: state.project.texts.filter((t) => t.id !== id),
          }
        : null,
    })),
  addShape: (shape) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, shapes: [...state.project.shapes, shape] }
        : null,
    })),
  updateShape: (id, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            shapes: state.project.shapes.map((s) =>
              s.id === id ? { ...s, ...updates } : s
            ),
          }
        : null,
    })),
  removeShape: (id) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            shapes: state.project.shapes.filter((s) => s.id !== id),
          }
        : null,
    })),
  addImage: (image) =>
    set((state) => ({
      project: state.project
        ? { ...state.project, images: [...state.project.images, image] }
        : null,
    })),
  updateImage: (id, updates) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            images: state.project.images.map((i) =>
              i.id === id ? { ...i, ...updates } : i
            ),
          }
        : null,
    })),
  removeImage: (id) =>
    set((state) => ({
      project: state.project
        ? {
            ...state.project,
            images: state.project.images.filter((i) => i.id !== id),
          }
        : null,
    })),
  setLastSaved: (time) => set({ lastSaved: time }),
}))

export { defaultLayerId, defaultLayers }
