import { useRef, type MouseEvent as ReactMouseEvent } from 'react'
import { X, MapPin, Route, Type, Pentagon, Trash2, Image } from 'lucide-react'
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
    <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            {getIcon()}
          </div>
          <span className="font-semibold text-slate-800 text-sm">{getName()}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleDelete}
            className="p-2 hover:bg-red-50 rounded-xl transition-colors group"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-red-500" />
          </button>
          <button
            onClick={() => setSelectedElement(null)}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* ── Marker ── */}
        {marker && (
          <>
            <Section title="Información">
              <Field label="Nombre">
                <InputVal
                  value={marker.name}
                  onChange={(v) => updateMarker(marker.id, { name: v })}
                  placeholder="Nombre del punto"
                />
              </Field>
              <Field label="Descripción">
                <textarea
                  value={marker.description || ''}
                  onChange={(e) => updateMarker(marker.id, { description: e.target.value })}
                  placeholder="Añadir descripción..."
                  className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-300"
                />
              </Field>
            </Section>

            <Section title="Ícono">
              <div className="grid grid-cols-6 gap-1.5">
                {MARKER_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => updateMarker(marker.id, { icon: icon.id })}
                    className={`p-2 rounded-xl border-2 transition-all flex items-center justify-center ${
                      marker.icon === icon.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
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
            </Section>

            <Section title="Color">
              <div className="flex flex-wrap gap-2">
                {MARKER_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateMarker(marker.id, { color })}
                    className={`w-8 h-8 rounded-full border-[3px] transition-all shadow-sm ${
                      marker.color === color
                        ? 'border-slate-800 scale-110 shadow-md'
                        : 'border-white hover:scale-110 hover:shadow-md'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <label className="w-8 h-8 rounded-full border-[3px] border-dashed border-slate-300 cursor-pointer flex items-center justify-center hover:border-blue-400 transition-colors overflow-hidden relative">
                  <input
                    type="color"
                    value={marker.color}
                    onChange={(e) => updateMarker(marker.id, { color: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">+</span>
                </label>
              </div>
            </Section>

            <Section title={`Tamaño · ${marker.size}px`}>
              <input
                type="range"
                min={16}
                max={64}
                value={marker.size}
                onChange={(e) => updateMarker(marker.id, { size: Number(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </Section>
          </>
        )}

        {/* ── Route ── */}
        {route && (
          <>
            <Section title="Información">
              <Field label="Nombre">
                <InputVal
                  value={route.name}
                  onChange={(v) => updateRoute(route.id, { name: v })}
                  placeholder="Nombre de la ruta"
                />
              </Field>
            </Section>

            <Section title="Transporte">
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'car' as RouteProfile, icon: '🚗', label: 'Auto' },
                  { id: 'bike' as RouteProfile, icon: '🚴', label: 'Bici' },
                  { id: 'walk' as RouteProfile, icon: '🚶', label: 'Pie' },
                ]).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleRouteProfileChange(mode.id)}
                    className={`flex flex-col items-center gap-0.5 p-2.5 rounded-xl border-2 transition-all text-xs ${
                      route.profile === mode.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-lg">{mode.icon}</span>
                    <span className="font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Color">
              <div className="flex items-center gap-3">
                <label className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-md hover:shadow-lg transition-shadow">
                  <input
                    type="color"
                    value={route.color}
                    onChange={(e) => updateRoute(route.id, { color: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: route.color }} />
                </label>
                <input
                  type="text"
                  value={route.color}
                  onChange={(e) => updateRoute(route.id, { color: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </Section>

            <Section title="Estilo">
              <div className="grid grid-cols-3 gap-1.5">
                {([
                  { id: 'solid', label: 'Sólida', icon: '━━━' },
                  { id: 'dashed', label: 'Discontinua', icon: '╌╌╌' },
                  { id: 'dotted', label: 'Punteada', icon: '·····' },
                ] as const).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => updateRoute(route.id, { style: s.id })}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs transition-all ${
                      route.style === s.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-[10px] tracking-widest opacity-60">{s.icon}</span>
                    <span className="font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={`Grosor · ${route.width}px`}>
              <input type="range" min={1} max={20} value={route.width} onChange={(e) => updateRoute(route.id, { width: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <Section title={`Opacidad · ${Math.round(route.opacity * 100)}%`}>
              <input type="range" min={0} max={1} step={0.1} value={route.opacity} onChange={(e) => updateRoute(route.id, { opacity: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1">
              <p className="text-xs font-medium text-slate-500">Datos de ruta</p>
              <p className="text-sm text-slate-700">{route.coordinates.length} puntos</p>
              {route.distance != null && <p className="text-sm text-slate-700">{(route.distance / 1000).toFixed(2)} km</p>}
              {route.duration != null && <p className="text-sm text-slate-700">{Math.round(route.duration / 60)} min</p>}
            </div>
          </>
        )}

        {/* ── Text ── */}
        {text && (
          <>
            <Section title="Contenido">
              <textarea
                value={text.content}
                onChange={(e) => updateText(text.id, { content: e.target.value })}
                placeholder="Escribe tu texto..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-300"
              />
            </Section>

            <Section title="Tipografía">
              <div className="grid grid-cols-2 gap-1.5">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => updateText(text.id, { fontFamily: font.value })}
                    className={`px-2 py-2 rounded-xl border-2 text-xs transition-all ${
                      text.fontFamily === font.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 text-slate-600'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Peso">
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'normal', label: 'Normal' },
                  { value: 'bold', label: 'Negrita' },
                  { value: '300', label: 'Fino' },
                  { value: '600', label: 'Semi' },
                ].map((w) => (
                  <button
                    key={w.value}
                    onClick={() => updateText(text.id, { fontWeight: w.value })}
                    className={`px-2 py-2 rounded-xl border-2 text-xs font-medium transition-all ${
                      text.fontWeight === w.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Color">
              <div className="flex items-center gap-3">
                <label className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-md hover:shadow-lg transition-shadow">
                  <input type="color" value={text.color} onChange={(e) => updateText(text.id, { color: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: text.color }} />
                </label>
                <input
                  type="text"
                  value={text.color}
                  onChange={(e) => updateText(text.id, { color: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </Section>

            <Section title={`Tamaño · ${text.fontSize}px`}>
              <input type="range" min={8} max={72} value={text.fontSize} onChange={(e) => updateText(text.id, { fontSize: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <Section title={`Rotación · ${text.rotation}°`}>
              <input type="range" min={-180} max={180} value={text.rotation} onChange={(e) => updateText(text.id, { rotation: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <Section title={`Sombra · ${text.shadow ?? 4}px`}>
              <div className="flex items-center gap-3">
                <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-sm">
                  <input type="color" value={text.shadowColor ?? '#000000'} onChange={(e) => updateText(text.id, { shadowColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: text.shadowColor ?? '#000000' }} />
                </label>
                <input type="range" min={0} max={20} value={text.shadow ?? 4} onChange={(e) => updateText(text.id, { shadow: Number(e.target.value) })} className="flex-1 accent-blue-500" />
              </div>
            </Section>
          </>
        )}

        {/* ── Shape ── */}
        {shape && (
          <>
            <Section title="Tipo">
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 border border-slate-100">
                {shape.type === 'polygon' ? 'Polígono' : 'Línea'}
              </div>
            </Section>

            <Section title="Color de borde">
              <div className="flex items-center gap-3">
                <label className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-md hover:shadow-lg transition-shadow">
                  <input type="color" value={shape.borderColor} onChange={(e) => updateShape(shape.id, { borderColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: shape.borderColor }} />
                </label>
                <input
                  type="text"
                  value={shape.borderColor}
                  onChange={(e) => updateShape(shape.id, { borderColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </Section>

            <Section title="Color de relleno">
              <div className="flex items-center gap-3">
                <label className="relative w-10 h-10 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-md hover:shadow-lg transition-shadow">
                  <input type="color" value={shape.fillColor} onChange={(e) => updateShape(shape.id, { fillColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: shape.fillColor }} />
                </label>
                <input
                  type="text"
                  value={shape.fillColor}
                  onChange={(e) => updateShape(shape.id, { fillColor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />
              </div>
            </Section>

            <Section title={`Opacidad de relleno · ${Math.round(shape.fillOpacity * 100)}%`}>
              <input type="range" min={0} max={1} step={0.1} value={shape.fillOpacity} onChange={(e) => updateShape(shape.id, { fillOpacity: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <Section title={`Grosor de borde · ${shape.borderWidth}px`}>
              <input type="range" min={1} max={10} value={shape.borderWidth} onChange={(e) => updateShape(shape.id, { borderWidth: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>
          </>
        )}

        {/* ── Image ── */}
        {image && (
          <>
            <Section title="Información">
              <Field label="Nombre">
                <InputVal
                  value={image.name}
                  onChange={(v) => updateImage(image.id, { name: v })}
                  placeholder="Nombre de la imagen"
                />
              </Field>
            </Section>

            <Section title="Forma">
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  { value: 'square', label: 'Cuadrado', icon: '▢' },
                  { value: 'circle', label: 'Círculo', icon: '○' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateImage(image.id, { shape: opt.value })}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-xl border-2 transition-all ${
                      image.shape === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-100 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </Section>

            {(image.shape === 'square' || image.shape === 'circle') && (
              <Section title="Borde">
                <Field label={`Grosor · ${image.borderWidth}px`}>
                  <input type="range" min={0} max={20} value={image.borderWidth} onChange={(e) => updateImage(image.id, { borderWidth: Number(e.target.value) })} className="w-full accent-blue-500" />
                </Field>
                <Field label="Color">
                  <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-sm">
                    <input type="color" value={image.borderColor} onChange={(e) => updateImage(image.id, { borderColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: image.borderColor }} />
                  </label>
                </Field>
                {image.shape === 'square' && (
                  <Field label={`Esquinas · ${image.cornerRadius}px`}>
                    <input type="range" min={0} max={50} value={image.cornerRadius} onChange={(e) => updateImage(image.id, { cornerRadius: Number(e.target.value) })} className="w-full accent-blue-500" />
                  </Field>
                )}
              </Section>
            )}

            <Section title="Sombra">
              <Field label={`Intensidad · ${image.shadow}px`}>
                <input type="range" min={0} max={30} value={image.shadow} onChange={(e) => updateImage(image.id, { shadow: Number(e.target.value) })} className="w-full accent-blue-500" />
              </Field>
              <Field label="Color">
                <label className="relative w-8 h-8 rounded-full overflow-hidden cursor-pointer border-[3px] border-white shadow-sm">
                  <input type="color" value={image.shadowColor} onChange={(e) => updateImage(image.id, { shadowColor: e.target.value })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full rounded-full border border-slate-200" style={{ backgroundColor: image.shadowColor }} />
                </label>
              </Field>
            </Section>

            <Section title={`Tamaño · ${image.width}px`}>
              <input type="range" min={32} max={300} value={image.width} onChange={(e) => { const v = Number(e.target.value); updateImage(image.id, { width: v, height: v }) }} className="w-full accent-blue-500" />
            </Section>

            <Section title={`Rotación · ${image.rotation}°`}>
              <input type="range" min={-180} max={180} value={image.rotation} onChange={(e) => updateImage(image.id, { rotation: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <Section title={`Opacidad · ${Math.round(image.opacity * 100)}%`}>
              <input type="range" min={0} max={1} step={0.05} value={image.opacity} onChange={(e) => updateImage(image.id, { opacity: Number(e.target.value) })} className="w-full accent-blue-500" />
            </Section>

            <button
              type="button"
              onClick={() => openImageModal('edit', image.id)}
              className="w-full px-3 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
            >
              Cambiar imagen
            </button>

            <Section title="Vista previa">
              <p className="text-[11px] text-slate-400 mb-2">Arrastra para encuadrar</p>
              <div className="border border-slate-200 rounded-xl p-3 flex items-center justify-center bg-slate-50">
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${image.cropX}% ${image.cropY}%`, pointerEvents: 'none' }}
                  />
                </div>
              </div>
            </Section>
          </>
        )}
      </div>
    </aside>
  )
}

/* ── Reusable sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  )
}

function InputVal({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-300"
    />
  )
}
