import { useEffect } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'
import { useMapStore } from '@/stores/map-store'
import { storageService } from '@/services/storage'
import { mergeViewIntoProject } from '@/lib/project-view'

export function useKeyboardShortcuts() {
  const { undo, redo, selectedElementId, setActiveTool } = useEditorStore()
  const { project, setLastSaved, removeMarker, removeRoute, removeText, removeShape, removeImage } = useProjectStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey

      if (isCtrlOrMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      if (isCtrlOrMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
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
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault()
          removeMarker(selectedElementId)
          removeRoute(selectedElementId)
          removeText(selectedElementId)
          removeShape(selectedElementId)
          removeImage(selectedElementId)
        }
      }

      if (e.key === 'Escape') {
        setActiveTool('select')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, selectedElementId, removeMarker, removeRoute, removeText, removeShape, removeImage, setActiveTool])
}
