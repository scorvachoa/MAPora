import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useMapStore } from '@/stores/map-store'
import { storageService } from '@/services/storage'
import { mergeViewIntoProject } from '@/lib/project-view'

export function useAutoSave(delay = 1000) {
  const project = useProjectStore((s) => s.project)
  const setLastSaved = useProjectStore((s) => s.setLastSaved)
  const settings = useMapStore((s) => s.settings)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!project) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        // Merge the live map view so the saved project keeps center/zoom/style.
        const projectToSave = mergeViewIntoProject(project, settings)
        await storageService.saveProject(projectToSave)
        setLastSaved(new Date().toISOString())
      } catch (error) {
        console.error('Error auto-saving:', error)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [project, settings, delay, setLastSaved])
}
