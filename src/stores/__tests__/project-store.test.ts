import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from '@/stores/project-store'
import type { MapProject, MapMarker, MapRoute, MapLayer } from '@/types/map'

function makeProject(): MapProject {
  const layer: MapLayer = {
    id: 'layer-1',
    name: 'Capa 1',
    visible: true,
    locked: false,
    order: 0,
    type: 'markers',
  }
  return {
    id: 'project-test',
    name: 'Test',
    version: 1,
    createdAt: '',
    updatedAt: '',
    map: { center: [0, 0], zoom: 1, pitch: 0, bearing: 0, style: 'standard' },
    layers: [layer],
    markers: [],
    routes: [],
    texts: [],
    shapes: [],
    images: [],
    legend: { visible: false, title: '', items: [], position: 'bottom-right' },
    exportSettings: {
      format: 'png', width: 1920, height: 1080, quality: 90,
      includeLegend: true, includeScale: true, includeNorth: true, includeTitle: true,
    },
  }
}

describe('project-store', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: makeProject(),
      projects: [],
      lastSaved: null,
    })
  })

  const get = () => useProjectStore.getState()

  it('addMarker appends to the active project', () => {
    const marker: MapMarker = {
      id: 'm1', layerId: 'layer-1', coordinates: [1, 2], name: 'A',
      icon: 'pin', color: '#f00', size: 32, visible: true,
    }
    get().addMarker(marker)
    expect(get().project!.markers).toHaveLength(1)
    expect(get().project!.markers[0].id).toBe('m1')
  })

  it('updateMarker merges partial fields immutably', () => {
    get().addMarker({ id: 'm1', layerId: 'layer-1', coordinates: [1, 2], name: 'A', icon: 'pin', color: '#f00', size: 32, visible: true })
    get().updateMarker('m1', { name: 'B', color: '#0f0' })
    const m = get().project!.markers[0]
    expect(m.name).toBe('B')
    expect(m.color).toBe('#0f0')
    expect(m.coordinates).toEqual([1, 2])
  })

  it('removeMarker drops only the target', () => {
    get().addMarker({ id: 'm1', layerId: 'layer-1', coordinates: [1, 2], name: 'A', icon: 'pin', color: '#f00', size: 32, visible: true })
    get().addMarker({ id: 'm2', layerId: 'layer-1', coordinates: [1, 2], name: 'B', icon: 'pin', color: '#f00', size: 32, visible: true })
    get().removeMarker('m1')
    expect(get().project!.markers.map((m) => m.id)).toEqual(['m2'])
  })

  it('removeLayer cascades to all element types belonging to that layer', () => {
    const s = get()
    s.addLayer({ id: 'layer-2', name: 'L2', visible: true, locked: false, order: 1, type: 'routes' })
    s.addMarker({ id: 'm1', layerId: 'layer-1', coordinates: [0, 0], name: 'A', icon: 'pin', color: '#f00', size: 32, visible: true })
    s.addRoute({ id: 'r1', layerId: 'layer-2', name: 'R', coordinates: [[0, 0], [1, 1]], color: '#00f', width: 4, opacity: 1, style: 'solid', showArrows: false, showDistance: true, showDuration: true, type: 'manual', visible: true })
    s.addText({ id: 't1', layerId: 'layer-2', coordinates: [0, 0], content: 'x', fontSize: 16, fontWeight: 'normal', fontFamily: 'Arial', color: '#000', alignment: 'center', rotation: 0, visible: true })
    s.addShape({ id: 's1', layerId: 'layer-2', type: 'polyline', coordinates: [[[0, 0], [1, 1]]], color: '#000', fillColor: 'transparent', fillOpacity: 0, borderWidth: 2, borderColor: '#000', visible: true })
    s.addImage({ id: 'i1', layerId: 'layer-2', coordinates: [0, 0], url: 'x', name: 'I', width: 50, height: 50, rotation: 0, opacity: 1, visible: true, shape: 'square', cornerRadius: 0, cropX: 50, cropY: 50, borderWidth: 0, borderColor: '#000', shadow: 0, shadowColor: '#000' })

    get().removeLayer('layer-2')

    const p = get().project!
    expect(p.layers.find((l) => l.id === 'layer-2')).toBeUndefined()
    expect(p.routes).toHaveLength(0)
    expect(p.texts).toHaveLength(0)
    expect(p.shapes).toHaveLength(0)
    expect(p.images).toHaveLength(0)
    // markers on a different layer survive
    expect(p.markers).toHaveLength(1)
  })

  it('updateProject merges top-level fields', () => {
    get().updateProject({ name: 'Renamed' })
    expect(get().project!.name).toBe('Renamed')
    expect(get().project!.version).toBe(1)
  })

  it('does nothing when mutating with no active project', () => {
    useProjectStore.setState({ project: null })
    get().addMarker({ id: 'x', layerId: 'layer-1', coordinates: [0, 0], name: 'A', icon: 'pin', color: '#f00', size: 32, visible: true })
    expect(get().project).toBeNull()
  })

  it('routes carry computed distance/duration through add+update', () => {
    const route: MapRoute = {
      id: 'r1', layerId: 'layer-1', name: 'R', coordinates: [[0, 0], [1, 1]], color: '#00f',
      width: 4, opacity: 1, style: 'solid', showArrows: false, showDistance: true, showDuration: true,
      distance: 100, duration: 60, type: 'automatic', profile: 'car', visible: true,
    }
    get().addRoute(route)
    get().updateRoute('r1', { distance: 200 })
    expect(get().project!.routes[0].distance).toBe(200)
    expect(get().project!.routes[0].duration).toBe(60)
  })
})
