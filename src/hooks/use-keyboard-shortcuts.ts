import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'
import { useMapStore } from '@/stores/map-store'
import { useUIStore } from '@/stores/ui-store'
import { storageService } from '@/services/storage'
import { mergeViewIntoProject } from '@/lib/project-view'
import type { Tool } from '@/types/map'

const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: 'select',
  m: 'marker',
  a: 'route-ab',
  l: 'route',
  p: 'polygon',
  t: 'text',
  i: 'image',
}

export function useKeyboardShortcuts() {
  const { undo, redo, selectedElementId, isDrawing, drawingRemoveLastPoint, setActiveTool, setSelectedElement } = useEditorStore()
  const { project, setLastSaved, removeMarker, removeRoute, removeText, removeShape, removeImage } = useProjectStore()
  const { setExportModalOpen } = useUIStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      const isCtrlOrMeta = e.ctrlKey || e.metaKey

      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (isDrawing && drawingRemoveLastPoint) {
          drawingRemoveLastPoint()
        } else {
          undo()
        }
        return
      }

      if (isCtrlOrMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }

      if (isCtrlOrMeta && e.key === 's') {
        e.preventDefault()
        const current = useProjectStore.getState().project
        if (current) {
          const view = useMapStore.getState().settings
          void storageService.saveProject(mergeViewIntoProject(current, view)).then(() => {
            setLastSaved(new Date().toISOString())
          })
        }
        return
      }

      if (isCtrlOrMeta && e.key === 'e') {
        e.preventDefault()
        setExportModalOpen(true)
        return
      }

      if (e.key === 'Escape') {
        setActiveTool('select')
        return
      }

      if (isInput) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault()
          removeMarker(selectedElementId)
          removeRoute(selectedElementId)
          removeText(selectedElementId)
          removeShape(selectedElementId)
          removeImage(selectedElementId)
          setSelectedElement(null)
        }
        return
      }

      const tool = TOOL_SHORTCUTS[e.key.toLowerCase()]
      if (tool) {
        setActiveTool(tool)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedElementId, isDrawing, drawingRemoveLastPoint, removeMarker, removeRoute, removeText, removeShape, removeImage, setSelectedElement, setActiveTool, setExportModalOpen])
}
