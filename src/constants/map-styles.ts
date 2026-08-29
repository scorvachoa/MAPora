import type { MapStyle } from '@/types/map'
import type { StyleSpecification } from 'maplibre-gl'

export interface MapStyleDef {
  label: string
  url?: string
  style?: StyleSpecification
}

function rasterStyle(tiles: string[], attribution: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      raster: {
        type: 'raster',
        tiles,
        tileSize: 256,
        attribution,
      },
    },
    layers: [
      {
        id: 'raster',
        type: 'raster',
        source: 'raster',
      },
    ],
  }
}

export const MAP_STYLES: Record<MapStyle, MapStyleDef> = {
  standard: {
    label: 'Estándar',
    url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  light: {
    label: 'Claro',
    url: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json',
  },
  dark: {
    label: 'Oscuro',
    url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
  tourist: {
    label: 'Turístico',
    url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
  },
  osm: {
    label: 'OpenStreetMap',
    style: rasterStyle(
      ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      '© OpenStreetMap contributors'
    ),
  },
  topo: {
    label: 'OpenTopoMap',
    style: rasterStyle(
      ['https://tile.opentopomap.org/{z}/{x}/{y}.png'],
      '© OpenStreetMap contributors, © OpenTopoMap'
    ),
  },
}

export const MAP_STYLE_NAMES: Record<MapStyle, string> = {
  standard: 'Estándar',
  light: 'Claro',
  dark: 'Oscuro',
  tourist: 'Turístico',
  osm: 'OpenStreetMap',
  topo: 'OpenTopoMap',
}

export function getMapStyleSpec(style: MapStyle): string | StyleSpecification {
  const def = MAP_STYLES[style] ?? MAP_STYLES.standard
  return def.url ?? def.style ?? MAP_STYLES.standard.url!
}

export const MAP_STYLE = getMapStyleSpec('standard')
