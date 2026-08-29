import type { RouteProfile } from '@/services/routing'

export type Coordinates = [number, number]

export type MapStyle = 'standard' | 'light' | 'dark' | 'tourist' | 'osm' | 'topo'

export type Tool = 
  | 'select' 
  | 'marker' 
  | 'route' 
  | 'route-ab'
  | 'line' 
  | 'polygon' 
  | 'text' 
  | 'image'

export interface MapSettings {
  center: Coordinates
  zoom: number
  pitch: number
  bearing: number
  style: MapStyle
}

export interface MapProject {
  id: string
  name: string
  description?: string
  version: number
  createdAt: string
  updatedAt: string
  map: MapSettings
  layers: MapLayer[]
  markers: MapMarker[]
  routes: MapRoute[]
  texts: MapText[]
  shapes: MapShape[]
  images: MapImage[]
  legend: MapLegend
  exportSettings: ExportSettings
}

export interface MapLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  order: number
  type: 'markers' | 'routes' | 'texts' | 'shapes' | 'images'
  color?: string
}

export interface MapMarker {
  id: string
  layerId: string
  coordinates: Coordinates
  name: string
  description?: string
  icon: string
  color: string
  size: number
  visible: boolean
}

export interface MapRoute {
  id: string
  layerId: string
  name: string
  coordinates: Coordinates[]
  color: string
  width: number
  opacity: number
  style: 'solid' | 'dashed' | 'dotted'
  showArrows: boolean
  showDistance: boolean
  showDuration: boolean
  distance?: number
  duration?: number
  type: 'automatic' | 'manual'
  profile?: RouteProfile
  visible: boolean
}

export interface MapText {
  id: string
  layerId: string
  coordinates: Coordinates
  content: string
  fontSize: number
  fontWeight: string
  fontFamily: string
  color: string
  alignment: 'left' | 'center' | 'right'
  rotation: number
  backgroundColor?: string
  borderColor?: string
  shadow?: number
  shadowColor?: string
  visible: boolean
}

export interface MapShape {
  id: string
  layerId: string
  type: 'polygon' | 'polyline'
  coordinates: Coordinates[][]
  color: string
  fillColor: string
  fillOpacity: number
  borderWidth: number
  borderColor: string
  visible: boolean
}

export type ImageShape = 'square' | 'rectangle' | 'circle'

export interface MapImage {
  id: string
  layerId: string
  coordinates: Coordinates
  url: string
  name: string
  width: number
  height: number
  rotation: number
  opacity: number
  visible: boolean
  shape: ImageShape
  cornerRadius: number
  cropX: number
  cropY: number
  borderWidth: number
  borderColor: string
  shadow: number
  shadowColor: string
}

export interface MapLegend {
  visible: boolean
  title: string
  items: LegendItem[]
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export interface LegendItem {
  id: string
  label: string
  icon: string
  color: string
  type: 'marker' | 'route' | 'shape'
}

export interface ExportSettings {
  format: 'png' | 'jpg' | 'svg' | 'pdf'
  width: number
  height: number
  quality: number
  includeLegend: boolean
  includeScale: boolean
  includeNorth: boolean
  includeTitle: boolean
  title?: string
  subtitle?: string
  author?: string
}
