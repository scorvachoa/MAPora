import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  propertiesPanelOpen: boolean
  searchOpen: boolean
  exportModalOpen: boolean
  newProjectModalOpen: boolean
  duplicateProjectModalOpen: boolean
  versionHistoryOpen: boolean
  helpModalOpen: boolean
  loadingMessage: string | null
  toggleSidebar: () => void
  togglePropertiesPanel: () => void
  setSearchOpen: (open: boolean) => void
  setExportModalOpen: (open: boolean) => void
  setNewProjectModalOpen: (open: boolean) => void
  setDuplicateProjectModalOpen: (open: boolean) => void
  setVersionHistoryOpen: (open: boolean) => void
  setHelpModalOpen: (open: boolean) => void
  setPropertiesPanelOpen: (open: boolean) => void
  setLoadingMessage: (message: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  propertiesPanelOpen: true,
  searchOpen: false,
  exportModalOpen: false,
  newProjectModalOpen: false,
  duplicateProjectModalOpen: false,
  versionHistoryOpen: false,
  helpModalOpen: false,
  loadingMessage: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  togglePropertiesPanel: () =>
    set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setNewProjectModalOpen: (open) => set({ newProjectModalOpen: open }),
  setDuplicateProjectModalOpen: (open) => set({ duplicateProjectModalOpen: open }),
  setVersionHistoryOpen: (open) => set({ versionHistoryOpen: open }),
  setHelpModalOpen: (open) => set({ helpModalOpen: open }),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
}))
