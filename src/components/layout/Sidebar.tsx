import { useState, useMemo } from 'react'
import { 
  MousePointer2, 
  MapPin, 
  Route, 
  Pentagon, 
  Type, 
  Image, 
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Navigation,
  Pencil,
  Check,
  X,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore, defaultLayerId } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'
import { useMapActionsStore } from '@/stores/map-actions-store'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import type { Tool, Coordinates } from '@/types/map'

type ElementType = 'marker' | 'route' | 'text' | 'shape' | 'image'

interface LayerChild {
  id: string
  layerId: string
  type: ElementType
  name: string
  visible: boolean
  coordinates: Coordinates
}

const ELEMENT_META: Record<ElementType, { icon: React.ReactNode; label: string }> = {
  marker: { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Punto' },
  route: { icon: <Route className="h-3.5 w-3.5" />, label: 'Ruta' },
  text: { icon: <Type className="h-3.5 w-3.5" />, label: 'Texto' },
  shape: { icon: <Pentagon className="h-3.5 w-3.5" />, label: 'Forma' },
  image: { icon: <Image className="h-3.5 w-3.5" />, label: 'Imagen' },
}

const tools: { id: Tool; icon: React.ReactNode; label: string; color: string }[] = [
  { id: 'select', icon: <MousePointer2 className="h-5 w-5" />, label: 'Seleccionar', color: '#5f6368' },
  { id: 'marker', icon: <MapPin className="h-5 w-5" />, label: 'Añadir punto', color: '#ea4335' },
  { id: 'route-ab', icon: <Navigation className="h-5 w-5" />, label: 'Ruta A-B', color: '#4285f4' },
  { id: 'route', icon: <Route className="h-5 w-5" />, label: 'Dibujar línea', color: '#4285f4' },
  { id: 'polygon', icon: <Pentagon className="h-5 w-5" />, label: 'Dibujar forma', color: '#34a853' },
  { id: 'text', icon: <Type className="h-5 w-5" />, label: 'Añadir texto', color: '#ea4335' },
  { id: 'image', icon: <Image className="h-5 w-5" />, label: 'Añadir imagen', color: '#4285f4' },
]

const LAYER_COLORS = [
  { id: 'default', color: '#5f6368', label: 'Gris' },
  { id: 'red', color: '#ea4335', label: 'Rojo' },
  { id: 'blue', color: '#4285f4', label: 'Azul' },
  { id: 'green', color: '#34a853', label: 'Verde' },
  { id: 'yellow', color: '#fbbc04', label: 'Amarillo' },
  { id: 'purple', color: '#a142f4', label: 'Morado' },
  { id: 'pink', color: '#e91e63', label: 'Rosa' },
  { id: 'teal', color: '#00897b', label: 'Turquesa' },
]

interface SidebarProps {
  isOpen: boolean
}

export function Sidebar({ isOpen }: SidebarProps) {
  const { activeTool, setActiveTool, activeLayerId, setActiveLayer, selectedElementId, setSelectedElement } = useEditorStore()
  const {
    project,
    addLayer,
    updateLayer,
    removeLayer,
    updateMarker,
    removeMarker,
    updateRoute,
    removeRoute,
    updateText,
    removeText,
    updateShape,
    removeShape,
    updateImage,
    removeImage,
  } = useProjectStore()
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; layerId: string | null; layerName: string }>({
    show: false,
    layerId: null,
    layerName: '',
  })

  const layers = project?.layers || []

  const childrenByLayer = useMemo(() => {
    const map: Record<string, LayerChild[]> = {}
    if (project) {
      project.markers.forEach((m) =>
        (map[m.layerId] ||= []).push({ id: m.id, layerId: m.layerId, type: 'marker', name: m.name, visible: m.visible, coordinates: m.coordinates })
      )
      project.routes.forEach((r) =>
        (map[r.layerId] ||= []).push({ id: r.id, layerId: r.layerId, type: 'route', name: r.name, visible: r.visible, coordinates: r.coordinates[0] ?? [0, 0] })
      )
      project.texts.forEach((t) =>
        (map[t.layerId] ||= []).push({ id: t.id, layerId: t.layerId, type: 'text', name: t.content || 'Texto', visible: t.visible, coordinates: t.coordinates })
      )
      project.shapes.forEach((s) =>
        (map[s.layerId] ||= []).push({ id: s.id, layerId: s.layerId, type: 'shape', name: 'Forma', visible: s.visible, coordinates: s.coordinates[0]?.[0] ?? [0, 0] })
      )
      project.images.forEach((i) =>
        (map[i.layerId] ||= []).push({ id: i.id, layerId: i.layerId, type: 'image', name: i.name, visible: i.visible, coordinates: i.coordinates })
      )
    }
    return map
  }, [project])

  const updateFns: Record<ElementType, (id: string, updates: any) => void> = {
    marker: updateMarker,
    route: updateRoute,
    text: updateText,
    shape: updateShape,
    image: updateImage,
  }
  const removeFns: Record<ElementType, (id: string) => void> = {
    marker: removeMarker,
    route: removeRoute,
    text: removeText,
    shape: removeShape,
    image: removeImage,
  }

  const handleSelectElement = (el: LayerChild) => {
    setSelectedElement(el.id)
    useUIStore.getState().setPropertiesPanelOpen(true)
    if (el.coordinates[0] !== 0 || el.coordinates[1] !== 0) {
      useMapActionsStore.getState().triggerAction({ type: 'flyTo', center: el.coordinates, zoom: 16 })
    }
  }

  const toggleElementVisible = (el: LayerChild) => {
    updateFns[el.type](el.id, { visible: !el.visible })
  }

  const deleteElement = (el: LayerChild) => {
    removeFns[el.type](el.id)
  }

  const isLayerExpanded = (layerId: string) => expanded[layerId] !== false

  const toggleLayerExpanded = (layerId: string) => {
    setExpanded((prev) => ({ ...prev, [layerId]: prev[layerId] === false ? true : false }))
  }

  const handleAddLayer = () => {
    const newLayer = {
      id: `layer-${Date.now()}`,
      name: `Capa ${layers.length + 1}`,
      visible: true,
      locked: false,
      order: layers.length,
      type: 'markers' as const,
    }
    addLayer(newLayer)
    setActiveLayer(newLayer.id)
  }

  const startRenaming = (layer: { id: string; name: string }) => {
    setEditingLayerId(layer.id)
    setEditingName(layer.name)
  }

  const finishRenaming = (id: string) => {
    if (editingName.trim()) {
      updateLayer(id, { name: editingName.trim() })
    }
    setEditingLayerId(null)
    setEditingName('')
  }

  const cancelRenaming = () => {
    setEditingLayerId(null)
    setEditingName('')
  }

  const handleDeleteLayer = (layerId: string, layerName: string) => {
    setDeleteConfirm({ show: true, layerId, layerName })
  }

  const confirmDeleteLayer = () => {
    if (deleteConfirm.layerId) {
      removeLayer(deleteConfirm.layerId)
    }
    setDeleteConfirm({ show: false, layerId: null, layerName: '' })
  }

  const cancelDeleteLayer = () => {
    setDeleteConfirm({ show: false, layerId: null, layerName: '' })
  }

  if (!isOpen) return null

  return (
    <>
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-lg shadow-slate-300/40 animate-slide-in-left">
      <div className="p-3 border-b border-slate-100">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-3 px-1">
          Herramientas de edición
        </p>
        <div className="grid grid-cols-4 gap-1">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={cn(
                'tool-btn',
                activeTool === tool.id && 'active'
              )}
              onClick={() => setActiveTool(tool.id)}
              title={tool.label}
            >
              <span style={{ color: activeTool === tool.id ? '#2563eb' : tool.color }}>
                {tool.icon}
              </span>
              <span className="label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto sidebar-scroll">
        <div className="p-3">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
               Capas
             </p>
             <button
               onClick={handleAddLayer}
               className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 active:scale-90"
               title="Añadir capa"
             >
               <Plus className="h-4 w-4" />
             </button>
           </div>

          <div className="space-y-1">
            {layers.map((layer) => {
              const children = childrenByLayer[layer.id] || []
              const expandedLayer = isLayerExpanded(layer.id)
              return (
              <div key={layer.id} className="space-y-0.5">
              <div
                onClick={() => setActiveLayer(layer.id)}
                className={cn(
                  'group flex items-center gap-2 p-2 rounded-xl transition-all duration-200 cursor-pointer border border-transparent',
                  activeLayerId === layer.id
                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100'
                    : 'hover:bg-slate-50 hover:border-slate-200'
                )}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLayerExpanded(layer.id) }}
                  className="p-0.5 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                  title={expandedLayer ? 'Colapsar' : 'Expandir'}
                >
                  {expandedLayer ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </button>

                <button
                  onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
                   className="p-1 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                 >
                  {layer.visible ? (
                     <Eye className="h-4 w-4 text-slate-500" />
                   ) : (
                     <EyeOff className="h-4 w-4 text-slate-400" />
                   )}
                 </button>

                {/* Color indicator */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowColorPicker(showColorPicker === layer.id ? null : layer.id)}
                    className="w-3 h-3 rounded-full border border-gray-300 hover:scale-125 transition-transform"
                    style={{ backgroundColor: (layer as any).color || '#5f6368' }}
                    title="Cambiar color"
                  />
                  {showColorPicker === layer.id && (
                    <div className="absolute top-6 left-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-2 w-32">
                      <div className="grid grid-cols-4 gap-1">
                        {LAYER_COLORS.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              updateLayer(layer.id, { color: c.color } as any)
                              setShowColorPicker(null)
                            }}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              (layer as any).color === c.color
                                ? 'border-gray-800 scale-110'
                                : 'border-transparent hover:scale-110'
                            }`}
                            style={{ backgroundColor: c.color }}
                            title={c.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {editingLayerId === layer.id ? (
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') finishRenaming(layer.id)
                        if (e.key === 'Escape') cancelRenaming()
                      }}
                      onBlur={() => finishRenaming(layer.id)}
                      className="flex-1 min-w-0 px-2 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => finishRenaming(layer.id)}
                      className="p-0.5 hover:bg-green-100 rounded transition-colors shrink-0"
                    >
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </button>
                    <button
                      onClick={cancelRenaming}
                      className="p-0.5 hover:bg-red-100 rounded transition-colors shrink-0"
                    >
                      <X className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <span className={cn(
                    'flex-1 text-sm truncate min-w-0',
                    activeLayerId === layer.id ? 'text-blue-700 font-medium' : 'text-gray-700'
                  )}>
                    {layer.name}
                  </span>
                )}

                {editingLayerId !== layer.id && activeLayerId === layer.id && (
                  <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full shrink-0">
                    Activa
                  </span>
                )}

                {editingLayerId !== layer.id && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                    {layer.id !== defaultLayerId && (
                      <>
                        <button
                          onClick={() => startRenaming(layer)}
                          className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Renombrar capa"
                        >
                          <Pencil className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteLayer(layer.id, layer.name)}
                          className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                          title="Eliminar capa"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {expandedLayer && children.length > 0 && (
                <div className="ml-5 pl-3 border-l border-slate-200 space-y-0.5">
                  {children.map((el) => (
                    <div
                      key={el.id}
                      onClick={() => handleSelectElement(el)}
                      className={cn(
                        'group flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent',
                        selectedElementId === el.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-slate-50 hover:border-slate-200'
                      )}
                    >
                      <span className="text-slate-400 shrink-0">{ELEMENT_META[el.type].icon}</span>
                      <span className={cn('flex-1 text-sm truncate min-w-0', selectedElementId === el.id ? 'text-blue-700 font-medium' : 'text-slate-600')}>
                        {el.name}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleElementVisible(el) }}
                        className="p-1 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                        title="Mostrar/ocultar"
                      >
                        {el.visible ? <Eye className="h-3.5 w-3.5 text-slate-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-300" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteElement(el) }}
                        className="p-1 hover:bg-red-100 rounded-lg transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                        title="Eliminar elemento"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )})}
          </div>
        </div>

        <div className="p-3 border-t border-slate-100">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 border border-slate-200 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Selecciona una herramienta y haz clic en el mapa para empezar a dibujar.</p>
            <p className="text-xs text-slate-400">Doble clic para finalizar una línea o ruta.</p>
          </div>
        </div>
      </div>
    </aside>

    <ConfirmModal
      isOpen={deleteConfirm.show}
      title="Eliminar capa"
      message={`¿Estás seguro de que deseas eliminar la capa "${deleteConfirm.layerName}"? Todos los elementos de esta capa también serán eliminados.`}
      confirmLabel="Eliminar"
      cancelLabel="Cancelar"
      danger
      onConfirm={confirmDeleteLayer}
      onCancel={cancelDeleteLayer}
    />
    </>
  )
}
