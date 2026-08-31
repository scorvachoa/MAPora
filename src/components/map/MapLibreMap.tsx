import { useEffect, useRef, useState, useCallback } from 'react'
import { Map as MaplibreMap, Marker, NavigationControl, ScaleControl, AttributionControl, setWorkerUrl } from 'maplibre-gl'
import type * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useMapStore } from '@/stores/map-store'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'
import { useMapActionsStore } from '@/stores/map-actions-store'
import { useMapMarkers } from '@/hooks/use-map-markers'
import { useMapRoutes } from '@/hooks/use-map-routes'
import { useMapTexts } from '@/hooks/use-map-texts'
import { useMapShapes } from '@/hooks/use-map-shapes'
import { useMapImages } from '@/hooks/use-map-images'
import { useMapDrawing } from '@/hooks/use-map-drawing'
import { ImageSourceModal } from '@/components/modals/ImageSourceModal'
import { NodeOverlay } from './NodeOverlay'
import { routingService, type RouteProfile, getProfileLabel } from '@/services/routing'
import { MAP_STYLE, getMapStyleSpec } from '@/constants/map-styles'
import { setMaplibregl } from '@/lib/maplibre'
import { setMapInstance } from '@/lib/map-instance'
import type { Coordinates, Tool, MapStyle } from '@/types/map'

setWorkerUrl(maplibreWorkerUrl)
setMaplibregl({ Marker } as typeof maplibregl)

const ROUTE_AB_PREFIX = 'route-ab-'

export function MapLibreMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerARef = useRef<any>(null)
  const markerBRef = useRef<any>(null)
  const pointARef = useRef<Coordinates | null>(null)
  const pointBRef = useRef<Coordinates | null>(null)
  const selectedMarkerARef = useRef<any>(null)
  const selectedMarkerBRef = useRef<any>(null)
  const activeToolRef = useRef<Tool>('select')
  const profileRef = useRef<RouteProfile>('car')
  const activeLayerIdRef = useRef<string | null>(null)
  const moveFrameRef = useRef<number | null>(null)

  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routePanel, setRoutePanel] = useState({ visible: false, pointA: null as Coordinates | null, pointB: null as Coordinates | null, calculating: false, errorMsg: null as string | null, profile: 'car' as RouteProfile })
  const currentRouteIdRef = useRef<string | null>(null)

  const { setCenter, setZoom, setPitch, setBearing, settings, bumpStyleEpoch } = useMapStore()
  const { activeTool, setSelectedElement, setActiveTool, activeLayerId, selectedElementId, imageModal, openImageModal, closeImageModal } = useEditorStore()
  const { project, addMarker, addRoute, addText, addImage, removeRoute, updateImage } = useProjectStore()
  const projectMap = useProjectStore((s) => s.project?.map)
  const { pendingAction, clearAction } = useMapActionsStore()

  useMapMarkers(mapRef)
  useMapRoutes(mapRef)
  useMapTexts(mapRef)
  useMapShapes(mapRef)
  useMapImages(mapRef)
  useMapDrawing(mapRef, isMapLoaded)

  const routeABRoute = currentRouteIdRef.current ? project?.routes.find((r) => r.id === currentRouteIdRef.current) : null

  // Sync refs with state
  useEffect(() => {
    activeToolRef.current = activeTool
  }, [activeTool])

  useEffect(() => {
    profileRef.current = routePanel.profile
  }, [routePanel.profile])

  useEffect(() => {
    activeLayerIdRef.current = activeLayerId
  }, [activeLayerId])

  useEffect(() => {
    if (activeTool === 'image') {
      openImageModal('new')
    }
  }, [activeTool, openImageModal])

  const handleImageSource = (url: string, name: string) => {
    if (imageModal.mode === 'edit' && imageModal.imageId) {
      updateImage(imageModal.imageId, { url, name })
    } else {
      const map = mapRef.current
      const coords: Coordinates = map
        ? [map.getCenter().lng, map.getCenter().lat]
        : ((project?.map.center as Coordinates) ?? [0, 0])
      const id = `image-${Date.now()}`
      addImage({
        id,
        layerId: activeLayerIdRef.current || project?.layers[0]?.id || 'layer-default',
        coordinates: coords,
        url,
        name,
        width: 120,
        height: 120,
        rotation: 0,
        opacity: 1,
        visible: true,
        shape: 'rectangle',
        cornerRadius: 0,
        cropX: 50,
        cropY: 50,
        borderWidth: 0,
        borderColor: '#000000',
        shadow: 0,
        shadowColor: '#000000',
      })
      setSelectedElement(id)
      setActiveTool('select')
    }
    closeImageModal()
  }

  const handleImageLocalFile = (file: File) => {
    handleImageSource(URL.createObjectURL(file), file.name)
  }

  const handleImageUrl = (url: string) => {
    handleImageSource(url, url)
  }

  const calculateRouteAB = useCallback(async (a: Coordinates, b: Coordinates, profile: RouteProfile = 'car') => {
    setRoutePanel(prev => ({ ...prev, calculating: true, errorMsg: null }))
    try {
      const result = await routingService.calculateRoute(a, b, profile)
      const profileLabel = getProfileLabel(profile)
      if (currentRouteIdRef.current) removeRoute(currentRouteIdRef.current)
      const routeId = `${ROUTE_AB_PREFIX}${Date.now()}`
      currentRouteIdRef.current = routeId
      addRoute({
        id: routeId,
        layerId: activeLayerIdRef.current || project?.layers[0]?.id || 'layer-default',
        name: `Ruta A → B (${profileLabel})`,
        coordinates: result.coordinates,
        color: '#4285f4',
        width: 4,
        opacity: 1,
        style: 'solid',
        showArrows: false,
        showDistance: true,
        showDuration: true,
        distance: result.distance,
        duration: result.duration,
        type: 'automatic',
        profile,
        visible: true,
      })
      setRoutePanel(prev => ({ ...prev, visible: true, calculating: false, pointA: a, pointB: b, errorMsg: null, profile }))
    } catch (err) {
      console.error('Route error:', err)
      setRoutePanel(prev => ({ ...prev, calculating: false, errorMsg: 'No se pudo calcular la ruta.' }))
    }
  }, [addRoute, removeRoute, project])

  const createABMarker = useCallback((coords: Coordinates, label: 'A' | 'B') => {
    if (!mapRef.current) return null
    const color = label === 'A' ? '#ea4335' : '#4285f4'
    const el = document.createElement('div')
    el.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background: ${color};
      cursor: grab;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 3px solid white;
    `
    const marker = new Marker({ element: el, draggable: true })
      .setLngLat(coords)
      .addTo(mapRef.current)

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat()
      const c: Coordinates = [lngLat.lng, lngLat.lat]
      if (label === 'A') pointARef.current = c
      else pointBRef.current = c
      if (pointARef.current && pointBRef.current) {
        calculateRouteAB(pointARef.current, pointBRef.current, profileRef.current)
      }
    })

    return marker
  }, [calculateRouteAB])

  const clearABMarkers = useCallback(() => {
    if (markerARef.current) { markerARef.current.remove(); markerARef.current = null }
    if (markerBRef.current) { markerBRef.current.remove(); markerBRef.current = null }
    pointARef.current = null
    pointBRef.current = null
    if (currentRouteIdRef.current) {
      removeRoute(currentRouteIdRef.current)
      currentRouteIdRef.current = null
    }
  }, [removeRoute])

  // Single stable click handler using ref
  const handleMapClick = useCallback((e: any) => {
    const tool = activeToolRef.current
    const { lng, lat } = e.lngLat
    const coords: Coordinates = [lng, lat]

    if (tool === 'route-ab') {
      if (!pointARef.current) {
        pointARef.current = coords
        if (markerARef.current) markerARef.current.remove()
        markerARef.current = createABMarker(coords, 'A')
        setRoutePanel(prev => ({ ...prev, visible: true, pointA: coords, pointB: null, errorMsg: null }))
      } else if (!pointBRef.current) {
        pointBRef.current = coords
        if (markerBRef.current) markerBRef.current.remove()
        markerBRef.current = createABMarker(coords, 'B')
        setRoutePanel(prev => ({ ...prev, visible: true, pointB: coords }))
        calculateRouteAB(pointARef.current, coords, profileRef.current)
      }
      return
    }

    if (tool === 'marker') {
      addMarker({
        id: `marker-${Date.now()}`,
        layerId: activeLayerIdRef.current || project?.layers[0]?.id || 'layer-default',
        coordinates: coords,
        name: 'Nuevo marcador',
        description: '',
        icon: 'pin',
        color: '#ea4335',
        size: 32,
        visible: true,
      })
    } else if (tool === 'text') {
          addText({
            id: `text-${Date.now()}`,
            layerId: activeLayerIdRef.current || project?.layers[0]?.id || 'layer-default',
            coordinates: coords,
            content: 'Nuevo texto',
            fontSize: 16,
            fontWeight: 'normal',
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'center',
            rotation: 0,
            shadow: 4,
            shadowColor: '#000000',
            visible: true,
          })
    } else if (tool === 'select') {
      setSelectedElement(null)
    }
  }, [addMarker, addText, project, setSelectedElement, createABMarker, calculateRouteAB])

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return

    const newMap = new MaplibreMap({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: [-72.545, -13.163],
      zoom: 13,
      canvasContextAttributes: { preserveDrawingBuffer: true },
    })

    newMap.on('error', (e: any) => console.error('MapLibre error:', e))
    newMap.on('load', () => { setIsMapLoaded(true); mapRef.current = newMap })
    newMap.on('style.load', () => {
      setIsMapLoaded(true)
      mapRef.current = newMap
      bumpStyleEpoch()
    })
    newMap.on('move', () => {
      if (moveFrameRef.current) return
      moveFrameRef.current = requestAnimationFrame(() => {
        moveFrameRef.current = null
        const c = newMap.getCenter()
        setCenter([c.lng, c.lat])
        setZoom(newMap.getZoom())
        setPitch(newMap.getPitch())
        setBearing(newMap.getBearing())
      })
    })
    newMap.on('click', handleMapClick)

    newMap.addControl(new NavigationControl(), 'bottom-right')
    newMap.addControl(new ScaleControl(), 'bottom-left')
    newMap.addControl(new AttributionControl({ compact: true }), 'bottom-right')
    setMapInstance(newMap)

    return () => {
      if (moveFrameRef.current) cancelAnimationFrame(moveFrameRef.current)
      newMap.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!pendingAction || !mapRef.current) return
    if (pendingAction.type === 'flyTo') {
      mapRef.current.flyTo({ center: pendingAction.center, zoom: pendingAction.zoom || 15, essential: true })
    } else if (pendingAction.type === 'fitBounds') {
      mapRef.current.fitBounds(pendingAction.bounds, { padding: 50 })
    }
    clearAction()
  }, [pendingAction, clearAction])

  // Apply map style changes coming from the UI (map-store.settings.style).
  const appliedStyleRef = useRef<MapStyle | null>(settings.style)
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return
    if (appliedStyleRef.current === settings.style) return
    mapRef.current.setStyle(getMapStyleSpec(settings.style))
    appliedStyleRef.current = settings.style
  }, [settings.style, isMapLoaded])

  // Apply camera (center/zoom/pitch/bearing) when the loaded project changes.
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || !projectMap) return
    const map = mapRef.current
    const c = map.getCenter()
    if (
      c.lng !== projectMap.center[0] ||
      c.lat !== projectMap.center[1] ||
      map.getZoom() !== projectMap.zoom ||
      map.getPitch() !== projectMap.pitch ||
      map.getBearing() !== projectMap.bearing
    ) {
      map.setCenter(projectMap.center)
      map.setZoom(projectMap.zoom)
      map.setPitch(projectMap.pitch)
      map.setBearing(projectMap.bearing)
    }
  }, [projectMap, isMapLoaded])

  const prevToolRef = useRef<Tool>('select')
  useEffect(() => {
    if (activeTool === prevToolRef.current) return
    if (activeTool === 'route-ab') {
      // Starting a new A-B route session — previous route stays on map
      if (markerARef.current) { markerARef.current.remove(); markerARef.current = null }
      if (markerBRef.current) { markerBRef.current.remove(); markerBRef.current = null }
      if (selectedMarkerARef.current) { selectedMarkerARef.current.remove(); selectedMarkerARef.current = null }
      if (selectedMarkerBRef.current) { selectedMarkerBRef.current.remove(); selectedMarkerBRef.current = null }
      pointARef.current = null
      pointBRef.current = null
      currentRouteIdRef.current = null
      setRoutePanel({ visible: true, pointA: null, pointB: null, calculating: false, errorMsg: null, profile: 'car' })
    } else {
      // Leaving route-ab: keep markers/route on map, just hide the panel
      setRoutePanel(prev => ({ ...prev, visible: false }))
    }
    prevToolRef.current = activeTool
  }, [activeTool, clearABMarkers])

  // Recalculate the route when the transport mode changes (if both points exist)
  useEffect(() => {
    if (pointARef.current && pointBRef.current) {
      calculateRouteAB(pointARef.current, pointBRef.current, routePanel.profile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routePanel.profile])

  const cancelRouteAB = () => {
    clearABMarkers()
    setRoutePanel({ visible: false, pointA: null, pointB: null, calculating: false, errorMsg: null, profile: 'car' })
    setActiveTool('select')
  }

  const confirmRouteAB = () => {
    // Hide creation markers — selection markers will show if route is selected
    if (markerARef.current) { markerARef.current.remove(); markerARef.current = null }
    if (markerBRef.current) { markerBRef.current.remove(); markerBRef.current = null }
    pointARef.current = null
    pointBRef.current = null
    setRoutePanel(prev => ({ ...prev, visible: false }))
    setActiveTool('select')
  }

  // Show/hide A-B endpoint markers when a route-ab is selected/deselected
  useEffect(() => {
    if (!mapRef.current) return

    // Clean up previous selection markers
    if (selectedMarkerARef.current) { selectedMarkerARef.current.remove(); selectedMarkerARef.current = null }
    if (selectedMarkerBRef.current) { selectedMarkerBRef.current.remove(); selectedMarkerBRef.current = null }

    if (!selectedElementId || !selectedElementId.startsWith(ROUTE_AB_PREFIX)) return

    const route = project?.routes.find((r) => r.id === selectedElementId)
    if (!route || route.coordinates.length < 2) return

    const aCoords = route.coordinates[0]
    const bCoords = route.coordinates[route.coordinates.length - 1]

    const createStaticMarker = (coords: Coordinates, label: 'A' | 'B') => {
      const color = label === 'A' ? '#ea4335' : '#4285f4'
      const el = document.createElement('div')
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 50%;
        background: ${color};
        box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 3px solid white;
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: bold; font-size: 13px; font-family: Arial, sans-serif;
        pointer-events: none;
      `
      el.textContent = label
      return new Marker({ element: el, draggable: false })
        .setLngLat(coords)
        .addTo(mapRef.current!)
    }

    selectedMarkerARef.current = createStaticMarker(aCoords, 'A')
    selectedMarkerBRef.current = createStaticMarker(bCoords, 'B')
  }, [selectedElementId, project])

  const getCursorStyle = () => {
    switch (activeTool) {
      case 'marker': case 'route': case 'route-ab': case 'line': case 'polygon':
        return 'crosshair'
      default:
        return 'grab'
    }
  }

  return (
    <div className="relative flex-1 min-h-0">
      <div ref={mapContainer} className="absolute inset-0" style={{ cursor: getCursorStyle() }} />
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <p className="text-red-600">{error}</p>
        </div>
      )}
      
      {!isMapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 pointer-events-none">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando mapa...</p>
          </div>
        </div>
      )}

      {activeTool === 'route-ab' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20">
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-80">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-800">Ruta automática A → B</h3>
              <button onClick={cancelRouteAB} className="p-1 hover:bg-gray-100 rounded-full">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Modo de transporte</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'car' as RouteProfile, icon: '🚗', label: 'Auto' },
                  { id: 'bike' as RouteProfile, icon: '🚴', label: 'Bici' },
                  { id: 'walk' as RouteProfile, icon: '🚶', label: 'Pie' },
                ]).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setRoutePanel(prev => ({ ...prev, profile: mode.id }))}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition-all text-xs ${
                      routePanel.profile === mode.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <span className="text-lg">{mode.icon}</span>
                    <span className="font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">A</div>
                <span className={`text-sm ${routePanel.pointA ? 'text-gray-700' : 'text-gray-400'}`}>
                  {routePanel.pointA ? `${routePanel.pointA[1].toFixed(4)}, ${routePanel.pointA[0].toFixed(4)}` : 'Haz clic en el mapa...'}
                </span>
                {routePanel.pointA && <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />}
              </div>
              <div className="ml-3 border-l-2 border-dashed border-gray-300 h-3" />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">B</div>
                <span className={`text-sm ${routePanel.pointB ? 'text-gray-700' : 'text-gray-400'}`}>
                  {routePanel.pointB ? `${routePanel.pointB[1].toFixed(4)}, ${routePanel.pointB[0].toFixed(4)}` : (routePanel.pointA ? 'Haz clic para destino...' : 'Esperando punto A...')}
                </span>
                {routePanel.pointB && <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />}
              </div>
            </div>

            {routeABRoute && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Distancia</div>
                  <div className="text-sm font-semibold text-blue-700">
                    {((routeABRoute.distance ?? 0) / 1000).toFixed(2)} km
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-2 text-center">
                  <div className="text-xs text-gray-500">Duración</div>
                  <div className="text-sm font-semibold text-blue-700">
                    {Math.round((routeABRoute.duration ?? 0) / 60)} min
                  </div>
                </div>
              </div>
            )}

            {routePanel.calculating && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                Calculando ruta {getProfileLabel(routePanel.profile).toLowerCase()}...
              </div>
            )}

            {routePanel.errorMsg && (
              <div className="p-2 bg-red-50 rounded-lg mb-3">
                <p className="text-xs text-red-600">{routePanel.errorMsg}</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              {!routePanel.pointA && 'Paso 1: Haz clic para punto A (origen)'}
              {routePanel.pointA && !routePanel.pointB && !routePanel.calculating && 'Paso 2: Haz clic para punto B (destino)'}
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={cancelRouteAB}
                className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              {routeABRoute && (
                <button
                  onClick={confirmRouteAB}
                  className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-medium"
                >
                  Aceptar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <NodeOverlay />

      <ImageSourceModal
        open={imageModal.open}
        mode={imageModal.mode}
        onLocalFile={handleImageLocalFile}
        onUrl={handleImageUrl}
        onClose={() => {
          if (imageModal.mode === 'new') setActiveTool('select')
          closeImageModal()
        }}
      />
    </div>
  )
}
