import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { getMaplibregl } from '@/lib/maplibre'
import { MARKER_ICONS } from '@/constants/marker-icons'

function getMarkerIconSvg(iconId: string): string {
  const found = MARKER_ICONS.find((i) => i.id === iconId)
  return found?.svg || MARKER_ICONS[0].svg
}

function createMarkerElement(iconId: string, color: string, size: number): HTMLDivElement {
  const el = document.createElement('div')
  el.className = 'custom-marker'
  el.style.cursor = 'grab'
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.innerHTML = getMarkerIconSvg(iconId).replace(
    '<svg ',
    `<svg width="${size}" height="${size}" style="color: ${color}; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" `
  )
  return el
}

function isLayerVisible(project: any, layerId: string): boolean {
  if (!project) return false
  const layer = project.layers.find((l: any) => l.id === layerId)
  return layer ? layer.visible : true
}

export function useMapMarkers(mapRef: React.RefObject<any>) {
  const markersRef = useRef<Map<string, any>>(new Map())
  const { project, updateMarker } = useProjectStore()
  const { selectedElementId, setSelectedElement } = useEditorStore()

  useEffect(() => {
    if (!mapRef.current || !project) return

    const map = mapRef.current
    const currentMarkers = markersRef.current
    const maplibregl = getMaplibregl()

    // Remove markers that no longer exist
    currentMarkers.forEach((marker, id) => {
      if (!project.markers.find((m) => m.id === id)) {
        marker.remove()
        currentMarkers.delete(id)
      }
    })

    // Add or update markers
    project.markers.forEach((markerData) => {
      // Hide if element is not visible OR its layer is not visible
      if (!markerData.visible || !isLayerVisible(project, markerData.layerId)) {
        const existingMarker = currentMarkers.get(markerData.id)
        if (existingMarker) {
          existingMarker.remove()
          currentMarkers.delete(markerData.id)
        }
        return
      }

      let marker = currentMarkers.get(markerData.id)

      if (!marker) {
        const el = createMarkerElement(markerData.icon, markerData.color, markerData.size)

        marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat(markerData.coordinates)
          .addTo(map)

        el.addEventListener('click', (e: Event) => {
          e.stopPropagation()
          setSelectedElement(markerData.id)
        })

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          updateMarker(markerData.id, { coordinates: [lngLat.lng, lngLat.lat] })
        })

        currentMarkers.set(markerData.id, marker)
      } else {
        marker.setLngLat(markerData.coordinates)

        const el = marker.getElement()
        const svg = getMarkerIconSvg(markerData.icon)
        el.innerHTML = svg.replace(
          '<svg ',
          `<svg width="${markerData.size}" height="${markerData.size}" style="color: ${markerData.color}; display: block; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));" `
        )
        el.style.width = `${markerData.size}px`
        el.style.height = `${markerData.size}px`
        el.style.display = 'flex'
        el.style.alignItems = 'center'
        el.style.justifyContent = 'center'
      }
    })
  }, [project?.markers, project?.layers, mapRef, setSelectedElement, updateMarker])

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      if (id === selectedElementId) {
        const svg = el.querySelector('svg')
        if (svg) svg.style.filter = 'drop-shadow(0 0 8px #3b82f6) drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        el.style.cursor = 'pointer'
      } else {
        const svg = el.querySelector('svg')
        if (svg) svg.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        el.style.cursor = 'grab'
      }
    })
  }, [selectedElementId])
}
