import { LngLatBounds, type Map } from 'maplibre-gl'
import type { MapProject } from '@/types/map'

export function fitAllElements(map: Map, project: MapProject) {
  const coords: [number, number][] = [
    ...project.markers.map((m) => m.coordinates),
    ...project.routes.flatMap((r) => r.coordinates),
    ...project.texts.map((t) => t.coordinates),
    ...project.shapes.flatMap((s) => s.coordinates.flat()),
    ...project.images.map((i) => i.coordinates),
  ]

  if (coords.length === 0) return

  if (coords.length === 1) {
    map.flyTo({ center: coords[0], zoom: 15 })
    return
  }

  const bounds = new LngLatBounds()
  coords.forEach((c) => bounds.extend(c))
  map.fitBounds(bounds, { padding: 80, maxZoom: 16 })
}
