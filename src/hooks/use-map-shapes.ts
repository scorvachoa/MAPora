import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { useMapStore } from '@/stores/map-store'

function isLayerVisible(project: any, layerId: string): boolean {
  if (!project) return false
  const layer = project.layers.find((l: any) => l.id === layerId)
  return layer ? layer.visible : true
}

export function useMapShapes(mapRef: React.RefObject<any>) {
  const shapesRef = useRef<Map<string, boolean>>(new Map())
  const { project } = useProjectStore()
  const { setSelectedElement } = useEditorStore()
  const styleEpoch = useMapStore((s) => s.styleEpoch)

  useEffect(() => {
    if (!mapRef.current || !project) return

    const map = mapRef.current
    const currentShapes = shapesRef.current

    // Remove shapes that no longer exist
    currentShapes.forEach((_, id) => {
      if (!project.shapes.find((s) => s.id === id)) {
        if (map.getLayer(`shape-fill-${id}`)) {
          map.removeLayer(`shape-fill-${id}`)
        }
        if (map.getLayer(`shape-border-${id}`)) {
          map.removeLayer(`shape-border-${id}`)
        }
        if (map.getSource(`shape-${id}`)) {
          map.removeSource(`shape-${id}`)
        }
        currentShapes.delete(id)
      }
    })

    // Add or update shapes
    project.shapes.forEach((shapeData) => {
      // Hide if element is not visible OR its layer is not visible
      if (!shapeData.visible || !isLayerVisible(project, shapeData.layerId)) {
        if (map.getLayer(`shape-fill-${shapeData.id}`)) {
          map.removeLayer(`shape-fill-${shapeData.id}`)
        }
        if (map.getLayer(`shape-border-${shapeData.id}`)) {
          map.removeLayer(`shape-border-${shapeData.id}`)
        }
        if (map.getSource(`shape-${shapeData.id}`)) {
          map.removeSource(`shape-${shapeData.id}`)
        }
        currentShapes.delete(shapeData.id)
        return
      }

      const sourceId = `shape-${shapeData.id}`
      const source = map.getSource(sourceId)

      const isPolygon = shapeData.type === 'polygon'
      const geojson = {
        type: 'Feature',
        properties: { id: shapeData.id },
        geometry: {
          type: isPolygon ? 'Polygon' : 'LineString',
          coordinates: isPolygon ? shapeData.coordinates : shapeData.coordinates[0],
        },
      }

      if (!source) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: geojson,
        })

        if (shapeData.type === 'polygon') {
          map.addLayer({
            id: `shape-fill-${shapeData.id}`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': shapeData.fillColor,
              'fill-opacity': shapeData.fillOpacity,
            },
          })
        }

        map.addLayer({
          id: `shape-border-${shapeData.id}`,
          type: 'line',
          source: sourceId,
          paint: {
            'line-color': shapeData.borderColor,
            'line-width': shapeData.borderWidth,
          },
        })

        const clickSourceId = `shape-border-${shapeData.id}`
        map.on('click', clickSourceId, () => {
          setSelectedElement(shapeData.id)
        })

        map.on('mouseenter', clickSourceId, () => {
          map.getCanvas().style.cursor = 'pointer'
        })

        map.on('mouseleave', clickSourceId, () => {
          map.getCanvas().style.cursor = ''
        })

        currentShapes.set(shapeData.id, true)
      } else {
        source.setData(geojson)

        if (shapeData.type === 'polygon') {
          map.setPaintProperty(`shape-fill-${shapeData.id}`, 'fill-color', shapeData.fillColor)
          map.setPaintProperty(`shape-fill-${shapeData.id}`, 'fill-opacity', shapeData.fillOpacity)
        }
        map.setPaintProperty(`shape-border-${shapeData.id}`, 'line-color', shapeData.borderColor)
        map.setPaintProperty(`shape-border-${shapeData.id}`, 'line-width', shapeData.borderWidth)
      }
    })
  }, [project?.shapes, project?.layers, mapRef, setSelectedElement, styleEpoch])
}
