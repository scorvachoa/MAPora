import { create } from 'zustand'

interface UIState {
  sidebarOpen: boolean
  propertiesPanelOpen: boolean
  searchOpen: boolean
  exportModalOpen: boolean
  newProjectModalOpen: boolean
  loadingMessage: string | null
  toggleSidebar: () => void
  togglePropertiesPanel: () => void
  setSearchOpen: (open: boolean) => void
  setExportModalOpen: (open: boolean) => void
  setNewProjectModalOpen: (open: boolean) => void
  setPropertiesPanelOpen: (open: boolean) => void
  setLoadingMessage: (message: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  propertiesPanelOpen: true,
  searchOpen: false,
  exportModalOpen: false,
  newProjectModalOpen: false,
  loadingMessage: null,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  togglePropertiesPanel: () =>
    set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setNewProjectModalOpen: (open) => set({ newProjectModalOpen: open }),
  setPropertiesPanelOpen: (open) => set({ propertiesPanelOpen: open }),
  setLoadingMessage: (message) => set({ loadingMessage: message }),
}))
