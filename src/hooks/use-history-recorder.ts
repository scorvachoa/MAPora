import { useEffect } from 'react'
import { useEditorStore, applyingHistory } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'

// Records project mutations into the undo/redo history. Edits are debounced so
// that a continuous drag produces a single undo step. Programmatic restores
// (undo/redo) are skipped via the `applyingHistory` guard.
export function useHistoryRecorder() {
  const record = useEditorStore((s) => s.record)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null

    const unsub = useProjectStore.subscribe((state, prev) => {
      if (state.project === prev.project) return
      if (applyingHistory) return
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => record('edit'), 300)
    })

    return () => {
      unsub()
      if (timer) clearTimeout(timer)
    }
  }, [record])
}
