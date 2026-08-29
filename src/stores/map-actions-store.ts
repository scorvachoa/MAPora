import { create } from 'zustand'

type MapAction = 
  | { type: 'flyTo'; center: [number, number]; zoom?: number }
  | { type: 'fitBounds'; bounds: [[number, number], [number, number]] }

interface MapActionsState {
  pendingAction: MapAction | null
  triggerAction: (action: MapAction) => void
  clearAction: () => void
}

export const useMapActionsStore = create<MapActionsState>((set) => ({
  pendingAction: null,
  triggerAction: (action) => set({ pendingAction: action }),
  clearAction: () => set({ pendingAction: null }),
}))
