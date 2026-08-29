import { create } from 'zustand'
import type { MapSettings, MapStyle, Coordinates } from '@/types/map'

interface MapState {
  settings: MapSettings
  isLoaded: boolean
  styleEpoch: number
  setCenter: (center: Coordinates) => void
  setZoom: (zoom: number) => void
  setPitch: (pitch: number) => void
  setBearing: (bearing: number) => void
  setStyle: (style: MapStyle) => void
  setLoaded: (loaded: boolean) => void
  bumpStyleEpoch: () => void
}

export const useMapStore = create<MapState>((set) => ({
  settings: {
    center: [-72.545, -13.163],
    zoom: 13,
    pitch: 0,
    bearing: 0,
    style: 'standard',
  },
  isLoaded: false,
  styleEpoch: 0,
  setCenter: (center) =>
    set((state) => ({ settings: { ...state.settings, center } })),
  setZoom: (zoom) =>
    set((state) => ({ settings: { ...state.settings, zoom } })),
  setPitch: (pitch) =>
    set((state) => ({ settings: { ...state.settings, pitch } })),
  setBearing: (bearing) =>
    set((state) => ({ settings: { ...state.settings, bearing } })),
  setStyle: (style) =>
    set((state) => ({ settings: { ...state.settings, style } })),
  setLoaded: (loaded) => set({ isLoaded: loaded }),
  bumpStyleEpoch: () => set((state) => ({ styleEpoch: state.styleEpoch + 1 })),
}))
