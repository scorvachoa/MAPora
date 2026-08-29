import { describe, it, expect } from 'vitest'
import { mergeViewIntoProject, pickLatestProject } from '../project-view'
import type { MapProject, MapSettings } from '@/types/map'

const baseProject: MapProject = {
  id: 'p1',
  name: 'Test',
  version: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  map: {
    center: [-72.5, -13.1],
    zoom: 10,
    pitch: 0,
    bearing: 0,
    style: 'standard',
  },
  layers: [],
  markers: [],
  routes: [],
  texts: [],
  shapes: [],
  images: [],
  legend: { visible: false, title: 'Leyenda', items: [], position: 'bottom-right' },
  exportSettings: {
    format: 'png',
    width: 1920,
    height: 1080,
    quality: 90,
    includeLegend: true,
    includeScale: true,
    includeNorth: true,
    includeTitle: true,
  },
}

const view: MapSettings = {
  center: [-70.0, -10.0],
  zoom: 14,
  pitch: 30,
  bearing: 45,
  style: 'dark',
}

describe('mergeViewIntoProject', () => {
  it('merges the live view into the project map', () => {
    const result = mergeViewIntoProject(baseProject, view)
    expect(result.map.center).toEqual([-70.0, -10.0])
    expect(result.map.zoom).toBe(14)
    expect(result.map.pitch).toBe(30)
    expect(result.map.bearing).toBe(45)
    expect(result.map.style).toBe('dark')
  })

  it('does not mutate the original project', () => {
    const before = JSON.parse(JSON.stringify(baseProject))
    mergeViewIntoProject(baseProject, view)
    expect(baseProject.map).toEqual(before.map)
  })

  it('preserves non-map fields', () => {
    const result = mergeViewIntoProject(baseProject, view)
    expect(result.id).toBe(baseProject.id)
    expect(result.markers).toBe(baseProject.markers)
  })
})

describe('pickLatestProject', () => {
  it('returns null when there are no projects', () => {
    expect(pickLatestProject([])).toBeNull()
  })

  it('returns the most recently updated project', () => {
    const older: MapProject = { ...baseProject, id: 'old', updatedAt: '2024-01-01T00:00:00.000Z' }
    const newer: MapProject = { ...baseProject, id: 'new', updatedAt: '2024-06-01T00:00:00.000Z' }
    expect(pickLatestProject([older, newer])?.id).toBe('new')
  })
})
