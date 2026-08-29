import { useEffect, useRef, useCallback } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'
import type { Coordinates, Tool } from '@/types/map'

export function useMapDrawing(mapRef: React.RefObject<any>, isMapLoaded: boolean) {
  const drawingPointsRef = useRef<Coordinates[]>([])
  const tempLayerRef = useRef<string | null>(null)
  const activeToolRef = useRef<Tool>('select')
  const activeLayerIdRef = useRef<string | null>(null)
  const { activeTool, activeLayerId, setSelectedElement } = useEditorStore()
  const { addRoute, addShape } = useProjectStore()

  useEffect(() => {
    activeToolRef.current = activeTool
  }, [activeTool])

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
  }, [activeLayerId])

  const clearTempLayer = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current
    if (tempLayerRef.current) {
      if (map.getLayer(tempLayerRef.current)) map.removeLayer(tempLayerRef.current)
      if (map.getSource(tempLayerRef.current)) map.removeSource(tempLayerRef.current)
      tempLayerRef.current = null
    }
    drawingPointsRef.current = []
  }, [mapRef])

  // Clean up when switching away from drawing tools + toggle double-click zoom
  useEffect(() => {
    if (mapRef.current) {
      if (activeTool === 'route' || activeTool === 'line' || activeTool === 'polygon') {
        mapRef.current.doubleClickZoom.disable()
      } else {
        mapRef.current.doubleClickZoom.enable()
      }
    }
    if (activeTool !== 'route' && activeTool !== 'line' && activeTool !== 'polygon') {
      clearTempLayer()
    }
  }, [activeTool, clearTempLayer, mapRef])

  useEffect(() => {
    if (!mapRef.current) return
    const map = mapRef.current

    const handleMapClick = (e: any) => {
      const tool = activeToolRef.current
      if (tool === 'route' || tool === 'line' || tool === 'polygon') {
        const { lng, lat } = e.lngLat
        drawingPointsRef.current.push([lng, lat])

        // Update temp layer
        if (tempLayerRef.current) {
          if (map.getLayer(tempLayerRef.current)) map.removeLayer(tempLayerRef.current)
          if (map.getSource(tempLayerRef.current)) map.removeSource(tempLayerRef.current)
        }

        const sourceId = `temp-drawing`
        tempLayerRef.current = sourceId

        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: drawingPointsRef.current },
          },
        })

        map.addLayer({
          id: sourceId,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 3, 'line-opacity': 0.8, 'line-dasharray': [2, 2] },
        })
      }
    }

    const handleDoubleClick = (e: any) => {
      const tool = activeToolRef.current
      if (tool === 'route' || tool === 'line' || tool === 'polygon') {
        e.preventDefault()
        if (drawingPointsRef.current.length >= 2) {
          let newId: string | null = null
          if (tool === 'route') {
            newId = `route-${Date.now()}`
            addRoute({
              id: newId,
              layerId: activeLayerIdRef.current || 'layer-default',
              name: 'Nueva ruta',
              coordinates: [...drawingPointsRef.current],
              color: '#3b82f6',
              width: 4,
              opacity: 1,
              style: 'solid',
              showArrows: false,
              showDistance: true,
              showDuration: true,
              type: 'manual',
              visible: true,
            })
          } else if (tool === 'line') {
            newId = `shape-${Date.now()}`
            addShape({
              id: newId,
              layerId: activeLayerIdRef.current || 'layer-default',
              type: 'polyline',
              coordinates: [drawingPointsRef.current],
              color: '#3b82f6',
              fillColor: 'transparent',
              fillOpacity: 0,
              borderWidth: 3,
              borderColor: '#3b82f6',
              visible: true,
            })
          } else if (tool === 'polygon' && drawingPointsRef.current.length >= 3) {
            newId = `shape-${Date.now()}`
            addShape({
              id: newId,
              layerId: activeLayerIdRef.current || 'layer-default',
              type: 'polygon',
              coordinates: [[...drawingPointsRef.current, drawingPointsRef.current[0]]],
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
              borderWidth: 3,
              borderColor: '#3b82f6',
              visible: true,
            })
          }
          if (newId) setSelectedElement(newId)
          clearTempLayer()
        }
      }
    }

    map.on('click', handleMapClick)
    map.on('dblclick', handleDoubleClick)

    return () => {
      map.off('click', handleMapClick)
      map.off('dblclick', handleDoubleClick)
    }
  }, [addRoute, addShape, clearTempLayer, mapRef, isMapLoaded])
}
