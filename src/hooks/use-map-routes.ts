import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { useMapStore } from '@/stores/map-store'

function isLayerVisible(project: any, layerId: string): boolean {
  if (!project) return false
  const layer = project.layers.find((l: any) => l.id === layerId)
  return layer ? layer.visible : true
}

function getLineDashArray(style?: string): number[] | null {
  if (style === 'dashed') return [2, 2]
  if (style === 'dotted') return [0.5, 2]
  return null
}

export function useMapRoutes(mapRef: React.RefObject<any>) {
  const routesRef = useRef<Map<string, any>>(new Map())
  const { project } = useProjectStore()
  const { selectedElementId, setSelectedElement } = useEditorStore()
  const styleEpoch = useMapStore((s) => s.styleEpoch)

  useEffect(() => {
    if (!mapRef.current || !project) return

    const map = mapRef.current
    const currentRoutes = routesRef.current

    // Remove routes that no longer exist
    currentRoutes.forEach((routeLayer, id) => {
      if (!project.routes.find((r) => r.id === id)) {
        if (map.getLayer(`route-${id}`)) {
          map.removeLayer(`route-${id}`)
        }
        if (map.getSource(`route-${id}`)) {
          map.removeSource(`route-${id}`)
        }
        currentRoutes.delete(id)
      }
    })

    // Add or update routes
    project.routes.forEach((routeData) => {
      // Hide if element is not visible OR its layer is not visible
      if (!routeData.visible || !isLayerVisible(project, routeData.layerId)) {
        if (map.getLayer(`route-${routeData.id}`)) {
          map.removeLayer(`route-${routeData.id}`)
        }
        if (map.getSource(`route-${routeData.id}`)) {
          map.removeSource(`route-${routeData.id}`)
        }
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
            geometry: {
              type: 'LineString',
              coordinates: routeData.coordinates,
            },
          },
        })

        map.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint,
        })

        map.on('click', sourceId, () => {
          setSelectedElement(routeData.id)
        })

        map.on('mouseenter', sourceId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', sourceId, () => {
          map.getCanvas().style.cursor = ''
        })

        currentRoutes.set(routeData.id, true)
      } else {
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeData.coordinates,
          },
        }
        source.setData(geojson)

        map.setPaintProperty(sourceId, 'line-color', routeData.color)
        map.setPaintProperty(sourceId, 'line-width', routeData.width)
        map.setPaintProperty(sourceId, 'line-opacity', routeData.opacity)
        map.setPaintProperty(sourceId, 'line-dasharray', getLineDashArray(routeData.style))
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
        if (isSelected) {
          map.setPaintProperty(sourceId, 'line-width', routeData.width + 2)
        } else {
          map.setPaintProperty(sourceId, 'line-width', routeData.width)
        }
      }
    })
  }, [selectedElementId, project?.routes, mapRef])
}
