import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { useMapStore } from '@/stores/map-store'
import { isLayerVisible } from '@/lib/layer-utils'

function getLineDashArray(style?: string): number[] | null {
  if (style === 'dashed') return [2, 2]
  if (style === 'dotted') return [0.5, 2]
  return null
}

interface RouteHandlers {
  click: () => void
  mouseenter: () => void
  mouseleave: () => void
}

export function useMapRoutes(mapRef: React.RefObject<any>) {
  const routesRef = useRef<Map<string, any>>(new Map())
  const handlersRef = useRef<Map<string, RouteHandlers>>(new Map())
  const { project } = useProjectStore()
  const { selectedElementId, setSelectedElement } = useEditorStore()
  const styleEpoch = useMapStore((s) => s.styleEpoch)

  useEffect(() => {
    if (!mapRef.current || !project) return

    const map = mapRef.current
    const currentRoutes = routesRef.current
    const handlers = handlersRef.current

    // Remove routes that no longer exist
    currentRoutes.forEach((_, id) => {
      if (!project.routes.find((r) => r.id === id)) {
        const sourceId = `route-${id}`
        // Clean up event listeners before removing layer
        const h = handlers.get(id)
        if (h) {
          if (map.getLayer(sourceId)) {
            map.off('click', sourceId, h.click)
            map.off('mouseenter', sourceId, h.mouseenter)
            map.off('mouseleave', sourceId, h.mouseleave)
          }
          handlers.delete(id)
        }
        if (map.getLayer(sourceId)) map.removeLayer(sourceId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
        currentRoutes.delete(id)
      }
    })

    // Add or update routes
    project.routes.forEach((routeData) => {
      if (!routeData.visible || !isLayerVisible(project, routeData.layerId)) {
        const sourceId = `route-${routeData.id}`
        const h = handlers.get(routeData.id)
        if (h) {
          if (map.getLayer(sourceId)) {
            map.off('click', sourceId, h.click)
            map.off('mouseenter', sourceId, h.mouseenter)
            map.off('mouseleave', sourceId, h.mouseleave)
          }
          handlers.delete(routeData.id)
        }
        if (map.getLayer(sourceId)) map.removeLayer(sourceId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)
        currentRoutes.delete(routeData.id)
        return
      }

      if (routeData.coordinates.length < 2) return

      const sourceId = `route-${routeData.id}`
      const source = map.getSource(sourceId)

      if (!source) {
        const dashArray = getLineDashArray(routeData.style)
        const paint: any = {
          'line-color': routeData.color,
          'line-width': routeData.width,
          'line-opacity': routeData.opacity,
        }
        if (dashArray) paint['line-dasharray'] = dashArray

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: routeData.coordinates },
          },
        })

        map.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint,
        })

        const clickHandler = () => { setSelectedElement(routeData.id) }
        const enterHandler = () => { map.getCanvas().style.cursor = 'pointer' }
        const leaveHandler = () => { map.getCanvas().style.cursor = '' }

        map.on('click', sourceId, clickHandler)
        map.on('mouseenter', sourceId, enterHandler)
        map.on('mouseleave', sourceId, leaveHandler)

        handlers.set(routeData.id, { click: clickHandler, mouseenter: enterHandler, mouseleave: leaveHandler })
        currentRoutes.set(routeData.id, true)
      } else {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeData.coordinates },
        })

        map.setPaintProperty(sourceId, 'line-color', routeData.color)
        map.setPaintProperty(sourceId, 'line-width', routeData.width)
        map.setPaintProperty(sourceId, 'line-opacity', routeData.opacity)
        const dashArray = getLineDashArray(routeData.style)
        map.setPaintProperty(sourceId, 'line-dasharray', dashArray === null ? undefined : dashArray)
      }
    })
  }, [project?.routes, project?.layers, mapRef, setSelectedElement, styleEpoch])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    project?.routes.forEach((routeData) => {
      const sourceId = `route-${routeData.id}`
      if (map.getLayer(sourceId)) {
        const isSelected = routeData.id === selectedElementId
        map.setPaintProperty(sourceId, 'line-width', isSelected ? routeData.width + 2 : routeData.width)
      }
    })
  }, [selectedElementId, project?.routes, mapRef])
}
