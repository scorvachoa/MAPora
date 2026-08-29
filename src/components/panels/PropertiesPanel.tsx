import { useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { X, MapPin, Route, Type, Pentagon, Trash2, Image } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { MARKER_ICONS, MARKER_COLORS } from '@/constants/marker-icons'
import { routingService, type RouteProfile, getProfileLabel } from '@/services/routing'
import type { Coordinates } from '@/types/map'

function reduceWaypoints(coords: Coordinates[], max: number): Coordinates[] {
  if (coords.length <= max) return coords
  const step = Math.ceil(coords.length / max)
  const reduced: Coordinates[] = []
  for (let i = 0; i < coords.length; i += step) reduced.push(coords[i])
  const last = coords[coords.length - 1]
  if (reduced[reduced.length - 1] !== last) reduced.push(last)
  return reduced
}

const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times' },
  { value: 'Courier New', label: 'Courier' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Impact', label: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans' },
]

interface PropertiesPanelProps {
  isOpen: boolean
}

export function PropertiesPanel({ isOpen }: PropertiesPanelProps) {
  const { project, updateMarker, updateRoute, updateText, updateShape, updateImage, removeMarker, removeRoute, removeText, removeShape, removeImage } = useProjectStore()
  const { selectedElementId, setSelectedElement, openImageModal } = useEditorStore()

  const imageDragRef = useRef<{ startX: number; startY: number; cropX: number; cropY: number; w: number; h: number } | null>(null)
  const imagePreviewRef = useRef<HTMLDivElement>(null)

  const startImageCropDrag = (e: ReactMouseEvent) => {
    if (!image) return
    const el = imagePreviewRef.current
    if (!el) return
    imageDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      cropX: image.cropX,
      cropY: image.cropY,
      w: el.clientWidth,
      h: el.clientHeight,
    }
    const onMove = (ev: MouseEvent) => {
      const d = imageDragRef.current
      if (!d) return
      const dx = ev.clientX - d.startX
      const dy = ev.clientY - d.startY
      const nx = Math.min(100, Math.max(0, d.cropX - (dx / d.w) * 100))
      const ny = Math.min(100, Math.max(0, d.cropY - (dy / d.h) * 100))
      updateImage(image.id, { cropX: Math.round(nx), cropY: Math.round(ny) })
    }
    const onUp = () => {
      imageDragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
    }
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!isOpen || !selectedElementId || !project) return null

  const marker = project.markers.find((m) => m.id === selectedElementId)
  const route = project.routes.find((r) => r.id === selectedElementId)
  const text = project.texts.find((t) => t.id === selectedElementId)
  const shape = project.shapes.find((s) => s.id === selectedElementId)
  const image = project.images.find((i) => i.id === selectedElementId)

  const element = marker || route || text || shape || image
  if (!element) return null

  const handleDelete = () => {
    if (marker) removeMarker(marker.id)
    if (route) removeRoute(route.id)
    if (text) removeText(text.id)
    if (shape) removeShape(shape.id)
    if (image) removeImage(image.id)
    setSelectedElement(null)
  }

  const handleRouteProfileChange = async (newProfile: RouteProfile) => {
    if (!route || route.coordinates.length < 2) return
    try {
      const isAuto = route.type === 'automatic'
      const waypoints =
        isAuto
          ? [route.coordinates[0], route.coordinates[route.coordinates.length - 1]]
          : reduceWaypoints(route.coordinates, 20)

      const result =
        waypoints.length === 2 && isAuto
          ? await routingService.calculateRoute(waypoints[0], waypoints[1], newProfile)
          : await routingService.calculateWaypointsRoute(waypoints, newProfile)

      const newName = route.name.replace(/\s*\(.+\)$/, '') + ` (${getProfileLabel(newProfile)})`
      updateRoute(route.id, {
        coordinates: result.coordinates,
        distance: result.distance,
        duration: result.duration,
        profile: newProfile,
        name: newName,
      })
    } catch (err) {
      console.error('Error recalculando ruta:', err)
    }
  }

  const getIcon = () => {
    if (marker) return <MapPin className="h-5 w-5 text-red-500" />
    if (route) return <Route className="h-5 w-5 text-blue-500" />
    if (text) return <Type className="h-5 w-5 text-purple-500" />
    if (shape) return <Pentagon className="h-5 w-5 text-green-500" />
    if (image) return <Image className="h-5 w-5 text-blue-500" />
    return null
  }

  const getName = () => {
    if (marker) return marker.name
    if (route) return route.name
    if (text) return text.content
    if (shape) return shape.type === 'polygon' ? 'Polígono' : 'Línea'
    if (image) return image.name
    return ''
  }

  return (
    <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-sm">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="font-medium text-gray-700">{getName()}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4 text-gray-500" />
          </button>
          <button
            onClick={() => setSelectedElement(null)}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {marker && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
              <Input
                value={marker.name}
                onChange={(e) => updateMarker(marker.id, { name: e.target.value })}
                placeholder="Nombre del punto"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <textarea
                value={marker.description || ''}
                onChange={(e) => updateMarker(marker.id, { description: e.target.value })}
                placeholder="Añadir descripción..."
                className="w-full h-20 px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Ícono</label>
              <div className="grid grid-cols-6 gap-1.5">
                {MARKER_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => updateMarker(marker.id, { icon: icon.id })}
                    className={`p-2 rounded-lg border-2 transition-all flex items-center justify-center ${
                      marker.icon === icon.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    title={icon.name}
                  >
                    <span
                      className="w-5 h-5"
                      dangerouslySetInnerHTML={{
                        __html: icon.svg.replace(
                          '<svg ',
                          `<svg width="20" height="20" style="color: ${marker.color}" `
                        )
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
              <div className="flex flex-wrap gap-1.5">
                {MARKER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateMarker(marker.id, { color })}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      marker.color === color 
                        ? 'border-gray-800 scale-110' 
                        : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <input
                  type="color"
                  value={marker.color}
                  onChange={(e) => updateMarker(marker.id, { color: e.target.value })}
                  className="w-7 h-7 rounded-full border-2 border-gray-200 cursor-pointer"
                  title="Color personalizado"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tamaño: {marker.size}px</label>
              <input
                type="range"
                min={16}
                max={64}
                value={marker.size}
                onChange={(e) => updateMarker(marker.id, { size: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {route && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
              <Input
                value={route.name}
                onChange={(e) => updateRoute(route.id, { name: e.target.value })}
                placeholder="Nombre de la ruta"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Tipo de transporte</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'car' as RouteProfile, icon: '🚗', label: 'Auto' },
                  { id: 'bike' as RouteProfile, icon: '🚴', label: 'Bici' },
                  { id: 'walk' as RouteProfile, icon: '🚶', label: 'Pie' },
                ]).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleRouteProfileChange(mode.id)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition-all text-xs ${
                      route.profile === mode.id
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

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={route.color}
                  onChange={(e) => updateRoute(route.id, { color: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <Input
                  value={route.color}
                  onChange={(e) => updateRoute(route.id, { color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Estilo de línea</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'solid', label: 'Sólida' },
                  { id: 'dashed', label: 'Discontinua' },
                  { id: 'dotted', label: 'Punteada' },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateRoute(route.id, { style: s.id })}
                    className={`px-2 py-2 rounded-lg border-2 text-xs transition-all ${
                      route.style === s.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grosor: {route.width}px</label>
              <input
                type="range"
                min={1}
                max={20}
                value={route.width}
                onChange={(e) => updateRoute(route.id, { width: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Opacidad</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={route.opacity}
                onChange={(e) => updateRoute(route.id, { opacity: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Información</label>
              <p className="text-sm text-gray-500">{route.coordinates.length} puntos</p>
              {route.distance && (
                <p className="text-sm text-gray-500">
                  Distancia: {(route.distance / 1000).toFixed(2)} km
                </p>
              )}
              {route.duration && (
                <p className="text-sm text-gray-500">
                  Duración: {Math.round(route.duration / 60)} min
                </p>
              )}
            </div>
          </div>
        )}

        {text && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Contenido</label>
              <textarea
                value={text.content}
                onChange={(e) => updateText(text.id, { content: e.target.value })}
                placeholder="Texto (Enter para nueva línea)"
                rows={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tamaño: {text.fontSize}px</label>
              <input
                type="range"
                min={8}
                max={72}
                value={text.fontSize}
                onChange={(e) => updateText(text.id, { fontSize: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Peso</label>
              <select
                value={text.fontWeight}
                onChange={(e) => updateText(text.id, { fontWeight: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="bold">Negrita</option>
                <option value="300">Fino</option>
                <option value="600">Semi-negrita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Tipografía</label>
              <div className="grid grid-cols-2 gap-1.5">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => updateText(text.id, { fontFamily: font.value })}
                    className={`px-2 py-2 rounded-lg border-2 text-xs transition-all ${
                      text.fontFamily === font.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={text.color}
                  onChange={(e) => updateText(text.id, { color: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <Input
                  value={text.color}
                  onChange={(e) => updateText(text.id, { color: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rotación: {text.rotation}°</label>
              <input
                type="range"
                min={-180}
                max={180}
                value={text.rotation}
                onChange={(e) => updateText(text.id, { rotation: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-500">Sombra: {text.shadow ?? 4}</label>
                <input
                  type="color"
                  value={text.shadowColor ?? '#000000'}
                  onChange={(e) => updateText(text.id, { shadowColor: e.target.value })}
                  className="w-7 h-7 rounded border-2 border-gray-200 cursor-pointer"
                  title="Color de sombra"
                />
              </div>
              <input
                type="range"
                min={0}
                max={20}
                value={text.shadow ?? 4}
                onChange={(e) => updateText(text.id, { shadow: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {shape && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
              <p className="text-sm text-gray-700">{shape.type === 'polygon' ? 'Polígono' : 'Línea'}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Color de borde</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={shape.borderColor}
                  onChange={(e) => updateShape(shape.id, { borderColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <Input
                  value={shape.borderColor}
                  onChange={(e) => updateShape(shape.id, { borderColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Color de relleno</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={shape.fillColor}
                  onChange={(e) => updateShape(shape.id, { fillColor: e.target.value })}
                  className="w-10 h-10 rounded-lg border-2 border-gray-200 cursor-pointer"
                />
                <Input
                  value={shape.fillColor}
                  onChange={(e) => updateShape(shape.id, { fillColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Opacidad de relleno</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={shape.fillOpacity}
                onChange={(e) => updateShape(shape.id, { fillOpacity: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grosor de borde: {shape.borderWidth}px</label>
              <input
                type="range"
                min={1}
                max={10}
                value={shape.borderWidth}
                onChange={(e) => updateShape(shape.id, { borderWidth: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}

        {image && (
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
              <Input
                value={image.name}
                onChange={(e) => updateImage(image.id, { name: e.target.value })}
                placeholder="Nombre de la imagen"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Forma</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'square', label: 'Cuadrado' },
                  { value: 'circle', label: 'Círculo' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateImage(image.id, { shape: opt.value })}
                    className={`px-2 py-2 text-xs rounded-lg border transition-colors ${
                      image.shape === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(image.shape === 'square' || image.shape === 'circle') && (
              <div className="space-y-3 border-t border-gray-100 pt-3">
                <label className="block text-xs font-semibold text-gray-600">Borde</label>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Grosor: {image.borderWidth}px</label>
                  <input
                    type="range"
                    min={0}
                    max={20}
                    value={image.borderWidth}
                    onChange={(e) => updateImage(image.id, { borderWidth: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">Color</label>
                  <input
                    type="color"
                    value={image.borderColor}
                    onChange={(e) => updateImage(image.id, { borderColor: e.target.value })}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  />
                </div>
                {image.shape === 'square' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Esquinas: {image.cornerRadius}px</label>
                    <input
                      type="range"
                      min={0}
                      max={50}
                      value={image.cornerRadius}
                      onChange={(e) => updateImage(image.id, { cornerRadius: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 border-t border-gray-100 pt-3">
              <label className="block text-xs font-semibold text-gray-600">Sombra</label>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Intensidad: {image.shadow}px</label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={image.shadow}
                  onChange={(e) => updateImage(image.id, { shadow: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-500">Color de sombra</label>
                <input
                  type="color"
                  value={image.shadowColor}
                  onChange={(e) => updateImage(image.id, { shadowColor: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Tamaño: {image.width}px</label>
              <input
                type="range"
                min={32}
                max={300}
                value={image.width}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  updateImage(image.id, { width: v, height: v })
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rotación: {image.rotation}°</label>
              <input
                type="range"
                min={-180}
                max={180}
                value={image.rotation}
                onChange={(e) => updateImage(image.id, { rotation: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Opacidad: {Math.round(image.opacity * 100)}%</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={image.opacity}
                onChange={(e) => updateImage(image.id, { opacity: Number(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <button
              type="button"
              onClick={() => openImageModal('edit', image.id)}
              className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Cambiar imagen
            </button>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vista previa (arrastra para encuadrar)</label>
              <div className="border border-gray-200 rounded-lg p-2 flex items-center justify-center">
                <div
                  ref={imagePreviewRef}
                  onMouseDown={startImageCropDrag}
                  style={{
                    width: 140,
                    height: image.shape === 'square' ? 140 : 100,
                    borderRadius: image.shape === 'circle' ? '50%' : `${image.cornerRadius}px`,
                    border: image.borderWidth > 0 ? `${image.borderWidth}px solid ${image.borderColor}` : 'none',
                    boxShadow: image.shadow > 0 ? `0 1px ${image.shadow}px ${image.shadowColor}` : 'none',
                    overflow: 'hidden',
                    cursor: 'grab',
                    touchAction: 'none',
                  }}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: `${image.cropX}% ${image.cropY}%`,
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
