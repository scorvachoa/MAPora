import React from 'react'
import { Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore, defaultLayerId } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { cn } from '@/lib/utils'

export function LayersPanel() {
  const { project, addLayer, updateLayer, removeLayer } = useProjectStore()
  const { activeLayerId, setActiveLayer } = useEditorStore()

  const layers = project?.layers || []

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
  }

  const handleToggleVisibility = (id: string) => {
    const layer = layers.find((l) => l.id === id)
    if (layer) {
      updateLayer(id, { visible: !layer.visible })
    }
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-xs font-medium text-muted-foreground">CAPAS</p>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleAddLayer}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1">
        {layers.map((layer) => (
          <div
            key={layer.id}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent',
              activeLayerId === layer.id && 'bg-accent'
            )}
            onClick={() => setActiveLayer(layer.id)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                handleToggleVisibility(layer.id)
              }}
            >
              {layer.visible ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>

            <span className="flex-1 text-sm truncate">{layer.name}</span>

            {layer.id !== defaultLayerId && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  removeLayer(layer.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
