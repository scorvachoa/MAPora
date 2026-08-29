import { describe, it, expect, beforeEach } from 'vitest'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'
import type { MapProject } from '@/types/map'

function makeProject(id: string): MapProject {
  return {
    id,
    name: id,
    version: 1,
    createdAt: '',
    updatedAt: '',
    map: { center: [0, 0], zoom: 1, pitch: 0, bearing: 0, style: 'standard' },
    layers: [{ id: 'l1', name: 'L', visible: true, locked: false, order: 0, type: 'markers' }],
    markers: [], routes: [], texts: [], shapes: [], images: [],
    legend: { visible: false, title: '', items: [], position: 'bottom-right' },
    exportSettings: { format: 'png', width: 1920, height: 1080, quality: 90, includeLegend: true, includeScale: true, includeNorth: true, includeTitle: true },
  }
}

describe('editor-store undo/redo (wired to project-store)', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: null, projects: [], lastSaved: null })
    useEditorStore.setState({
      activeTool: 'select',
      selectedElementId: null,
      activeLayerId: null,
      isDrawing: false,
      imageModal: { open: false, mode: 'new' },
      canUndo: false,
      canRedo: false,
    })
    useEditorStore.getState().resetHistory(null)
  })

  const get = () => useEditorStore.getState()

  it('seeds a baseline and cannot undo before any change', () => {
    const a = makeProject('a')
    useProjectStore.setState({ project: a })
    get().resetHistory(useProjectStore.getState().project)
    expect(get().canUndo).toBe(false)
    expect(get().canRedo).toBe(false)
    // undo is a no-op when there is nothing to revert
    get().undo()
    expect(useProjectStore.getState().project!.id).toBe('a')
  })

  it('records an edit and restores the previous project on undo', () => {
    const a = makeProject('a')
    useProjectStore.setState({ project: a })
    get().resetHistory(a)

    const b = makeProject('b')
    useProjectStore.setState({ project: b })
    get().record('edit')

    expect(get().canUndo).toBe(true)
    expect(get().canRedo).toBe(false)

    get().undo()
    expect(useProjectStore.getState().project!.id).toBe('a')
    expect(get().canUndo).toBe(false)
    expect(get().canRedo).toBe(true)
  })

  it('redo re-applies the undone project', () => {
    const a = makeProject('a')
    useProjectStore.setState({ project: a })
    get().resetHistory(a)

    const b = makeProject('b')
    useProjectStore.setState({ project: b })
    get().record('edit')

    get().undo()
    expect(useProjectStore.getState().project!.id).toBe('a')
    get().redo()
    expect(useProjectStore.getState().project!.id).toBe('b')
    expect(get().canRedo).toBe(false)
  })

  it('undo restores deep project state (markers), not just id', () => {
    const a = makeProject('a')
    useProjectStore.setState({ project: a })
    get().resetHistory(a)

    useProjectStore.getState().addMarker({
      id: 'm1', layerId: 'l1', coordinates: [1, 2], name: 'A', icon: 'pin', color: '#f00', size: 32, visible: true,
    })
    get().record('add marker')
    expect(useProjectStore.getState().project!.markers).toHaveLength(1)

    get().undo()
    expect(useProjectStore.getState().project!.markers).toHaveLength(0)
  })

  it('a new edit after undo discards the redo branch', () => {
    const a = makeProject('a')
    useProjectStore.setState({ project: a })
    get().resetHistory(a)

    const b = makeProject('b')
    useProjectStore.setState({ project: b })
    get().record('edit')
    get().undo() // -> a
    expect(get().canRedo).toBe(true)

    const c = makeProject('c')
    useProjectStore.setState({ project: c })
    get().record('edit')
    expect(get().canRedo).toBe(false)

    get().undo()
    expect(useProjectStore.getState().project!.id).toBe('a')
  })
})
