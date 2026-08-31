import { create } from 'zustand'
import { storageService, type ProjectSnapshot } from '@/services/storage'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'

interface VersionState {
  snapshots: ProjectSnapshot[]
  loading: boolean
  loadSnapshots: () => Promise<void>
  saveSnapshot: (label?: string) => Promise<void>
  restoreSnapshot: (snapshot: ProjectSnapshot) => void
  deleteSnapshot: (id: string) => Promise<void>
}

export const useVersionStore = create<VersionState>((set, get) => ({
  snapshots: [],
  loading: false,

  loadSnapshots: async () => {
    const { project } = useProjectStore.getState()
    if (!project) return
    set({ loading: true })
    try {
      const snapshots = await storageService.getSnapshots(project.id)
      set({ snapshots })
    } catch (error) {
      console.error('Error loading snapshots:', error)
    } finally {
      set({ loading: false })
    }
  },

  saveSnapshot: async (label?: string) => {
    const { project } = useProjectStore.getState()
    if (!project) return
    try {
      const snapshot = await storageService.saveSnapshot(project, label)
      set((state) => ({ snapshots: [snapshot, ...state.snapshots] }))
    } catch (error) {
      console.error('Error saving snapshot:', error)
    }
  },

  restoreSnapshot: (snapshot: ProjectSnapshot) => {
    const { setProject } = useProjectStore.getState()
    const { resetHistory } = useEditorStore.getState()
    setProject(snapshot.project)
    resetHistory(snapshot.project)
  },

  deleteSnapshot: async (id: string) => {
    try {
      await storageService.deleteSnapshot(id)
      set((state) => ({ snapshots: state.snapshots.filter((s) => s.id !== id) }))
    } catch (error) {
      console.error('Error deleting snapshot:', error)
    }
  },
}))
