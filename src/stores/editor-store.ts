import { create } from 'zustand'
import type { Tool } from '@/types/map'
import type { MapProject } from '@/types/map'
import { HistoryStack } from '@/lib/history'
import { useProjectStore } from '@/stores/project-store'

// Module-level undo/redo stack. It stores immutable project snapshots
// (Zustand already replaces project with a new object on every update).
const undoStack = new HistoryStack<MapProject | null>(null)

// Guards the project-store subscription so that programmatic restores
// (undo/redo) don't get recorded back into history.
let applyingHistory = false

interface EditorState {
  activeTool: Tool
  selectedElementId: string | null
  activeLayerId: string | null
  isDrawing: boolean
  drawingRemoveLastPoint: (() => void) | null
  imageModal: { open: boolean; mode: 'new' | 'edit'; imageId?: string }
  canUndo: boolean
  canRedo: boolean
  setActiveTool: (tool: Tool) => void
  setSelectedElement: (id: string | null) => void
  setActiveLayer: (id: string | null) => void
  setDrawing: (drawing: boolean) => void
  setDrawingRemoveLastPoint: (fn: (() => void) | null) => void
  openImageModal: (mode: 'new' | 'edit', imageId?: string) => void
  closeImageModal: () => void
  resetHistory: (project: MapProject | null) => void
  record: (label?: string) => void
  undo: () => void
  redo: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  selectedElementId: null,
  activeLayerId: null,
  isDrawing: false,
  drawingRemoveLastPoint: null,
  canUndo: false,
  canRedo: false,
  imageModal: { open: false, mode: 'new' },
  setActiveTool: (tool) => set({ activeTool: tool, selectedElementId: null }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  setActiveLayer: (id) => set({ activeLayerId: id }),
  setDrawing: (drawing) => set({ isDrawing: drawing }),
  setDrawingRemoveLastPoint: (fn) => set({ drawingRemoveLastPoint: fn }),
  openImageModal: (mode, imageId) => set({ imageModal: { open: true, mode, imageId } }),
  closeImageModal: () => set({ imageModal: { open: false, mode: 'new' } }),

  resetHistory: (project) => {
    undoStack.reset(project)
    set({ canUndo: undoStack.canUndo, canRedo: undoStack.canRedo })
  },

  record: (label = 'change') => {
    const project = useProjectStore.getState().project
    if (!project) return
    // Seed the baseline on first contact so undoing lands on the initial state.
    if (undoStack.current === null) {
      undoStack.reset(project)
      set({ canUndo: false, canRedo: false })
      return
    }
    undoStack.push(project, label)
    set({ canUndo: undoStack.canUndo, canRedo: undoStack.canRedo })
  },

  undo: () => {
    const prev = undoStack.undo()
    if (prev === null) return
    applyingHistory = true
    try {
      useProjectStore.setState({ project: prev })
    } finally {
      applyingHistory = false
    }
    set({ canUndo: undoStack.canUndo, canRedo: undoStack.canRedo, selectedElementId: null })
  },

  redo: () => {
    const next = undoStack.redo()
    if (next === null) return
    applyingHistory = true
    try {
      useProjectStore.setState({ project: next })
    } finally {
      applyingHistory = false
    }
    set({ canUndo: undoStack.canUndo, canRedo: undoStack.canRedo, selectedElementId: null })
  },
}))

export { applyingHistory }
