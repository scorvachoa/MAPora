import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { StorageService } from '@/services/storage'
import type { MapProject } from '@/types/map'

function makeProject(id = 'project-1'): MapProject {
  return {
    id,
    name: 'Test',
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

async function clearDb() {
  const db = await new Promise<IDBDatabase>((res, rej) => {
    const req = indexedDB.open('mapora-db', 2)
    req.onupgradeneeded = (e) => {
      const d = (e.target as IDBOpenDBRequest).result
      if (!d.objectStoreNames.contains('projects')) {
        d.createObjectStore('projects', { keyPath: 'id' })
      }
      if (!d.objectStoreNames.contains('snapshots')) {
        const store = d.createObjectStore('snapshots', { keyPath: 'id' })
        store.createIndex('projectId', 'projectId', { unique: false })
      }
    }
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error)
  })
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(['projects', 'snapshots'], 'readwrite')
    tx.objectStore('projects').clear()
    tx.objectStore('snapshots').clear()
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
    tx.onabort = () => rej(tx.error)
  })
  db.close()
}

describe('StorageService (IndexedDB via fake-indexeddb)', () => {
  let svc: StorageService

  beforeEach(async () => {
    await clearDb()
    svc = new StorageService()
  })
  afterEach(async () => {
    await clearDb()
  })

  it('saves and reads back a project by id', async () => {
    const p = makeProject('p-1')
    await svc.saveProject(p)
    const back = await svc.getProject('p-1')
    expect(back).not.toBeNull()
    expect(back!.id).toBe('p-1')
    expect(back!.name).toBe('Test')
  })

  it('returns null for a missing project', async () => {
    expect(await svc.getProject('nope')).toBeNull()
  })

  it('lists all saved projects', async () => {
    await svc.saveProject(makeProject('a'))
    await svc.saveProject(makeProject('b'))
    const all = await svc.getAllProjects()
    expect(all.map((p) => p.id).sort()).toEqual(['a', 'b'])
  })

  it('deletes a project', async () => {
    await svc.saveProject(makeProject('a'))
    await svc.deleteProject('a')
    expect(await svc.getProject('a')).toBeNull()
  })

  it('duplicates a project with a new id and name', async () => {
    const p = makeProject('orig')
    await svc.saveProject(p)
    const dup = await svc.duplicateProject(p, 'Copia')
    // saveProject resolves on request success, not on tx commit; let it flush.
    await new Promise((r) => setTimeout(r, 10))
    expect(dup.id).not.toBe('orig')
    expect(dup.id).toContain('project-')
    expect(dup.name).toBe('Copia')
    expect(await svc.getProject('orig')).not.toBeNull()
    expect(await svc.getProject(dup.id)).not.toBeNull()
  })

  it('persists the map view (center/zoom/style) across save/read', async () => {
    const p = makeProject('view-1')
    p.map = { center: [-70.0, -10.0], zoom: 14, pitch: 30, bearing: 45, style: 'dark' }
    await svc.saveProject(p)
    await new Promise((r) => setTimeout(r, 10))
    const back = await svc.getProject('view-1')
    expect(back!.map.center).toEqual([-70.0, -10.0])
    expect(back!.map.zoom).toBe(14)
    expect(back!.map.pitch).toBe(30)
    expect(back!.map.bearing).toBe(45)
    expect(back!.map.style).toBe('dark')
  })
})
