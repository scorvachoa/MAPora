import type { MapProject, MapSettings } from '@/types/map'

export function mergeViewIntoProject(project: MapProject, view: MapSettings): MapProject {
  return {
    ...project,
    map: {
      ...project.map,
      center: view.center,
      zoom: view.zoom,
      pitch: view.pitch,
      bearing: view.bearing,
      style: view.style,
    },
  }
}

export function pickLatestProject(projects: MapProject[]): MapProject | null {
  if (projects.length === 0) return null
  return [...projects].sort((a, b) =>
    (b.updatedAt || '').localeCompare(a.updatedAt || '')
  )[0]
}

