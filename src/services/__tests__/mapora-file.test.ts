import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MaporaFileService } from '@/services/storage/mapora-file'
import type { MapProject } from '@/types/map'

function validProject(): MapProject {
  return {
    id: 'project-1',
    name: 'Mi Mapa',
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

describe('MaporaFileService', () => {
  const svc = new MaporaFileService()

  describe('importFromFile', () => {
    it('parses a valid .mapora file', async () => {
      const json = JSON.stringify(validProject())
      const file = new File([json], 'mi.mapora', { type: 'application/json' })
      const project = await svc.importFromFile(file)
      expect(project.id).toBe('project-1')
      expect(project.name).toBe('Mi Mapa')
      expect(project.layers).toHaveLength(1)
    })

    it('rejects a file with wrong version', async () => {
      const bad = { ...validProject(), version: 2 }
      const file = new File([JSON.stringify(bad)], 'x.mapora', { type: 'application/json' })
      await expect(svc.importFromFile(file)).rejects.toThrow(/inválido/i)
    })

    it('rejects a file missing required sections', async () => {
      const file = new File([JSON.stringify({ id: 'x', name: 'y', version: 1 })], 'x.mapora')
      await expect(svc.importFromFile(file)).rejects.toThrow()
    })

    it('rejects malformed JSON', async () => {
      const file = new File(['{not json'], 'x.mapora')
      await expect(svc.importFromFile(file)).rejects.toThrow()
    })
  })

  describe('exportToFile', () => {
    it('triggers a download without throwing', async () => {
      const click = vi.fn()
      const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(click)

      expect(() => svc.exportToFile(validProject())).not.toThrow()
      expect(click).toHaveBeenCalled()
      expect(createSpy).toHaveBeenCalled()
      expect(revokeSpy).toHaveBeenCalled()

      vi.restoreAllMocks()
      vi.unstubAllGlobals()
    })
  })
})
