import type { MapProject } from '@/types/map'

export interface ProjectSnapshot {
  id: string
  projectId: string
  project: MapProject
  label: string
  createdAt: string
}

const DB_NAME = 'mapora-db'
const DB_VERSION = 2
const STORE_NAME = 'projects'
const SNAPSHOTS_STORE = 'snapshots'

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbInstance && dbInstance.objectStoreNames.contains(STORE_NAME)) {
    return Promise.resolve(dbInstance)
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
    request.onsuccess = () => {
      const db = request.result
      dbInstance = db
      db.onclose = () => { dbInstance = null; dbPromise = null }
      db.onerror = () => { dbInstance = null; dbPromise = null }
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        const store = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' })
        store.createIndex('projectId', 'projectId', { unique: false })
      }
    }
  })

  return dbPromise
}

export class StorageService {
  async saveProject(project: MapProject): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.put(project)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getProject(id: string): Promise<MapProject | null> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllProjects(): Promise<MapProject[]> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteProject(id: string): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async duplicateProject(project: MapProject, newName: string): Promise<MapProject> {
    const newProject: MapProject = {
      ...project,
      id: `project-${Date.now()}`,
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await this.saveProject(newProject)
    return newProject
  }

  async saveSnapshot(project: MapProject, label?: string): Promise<ProjectSnapshot> {
    const db = await openDB()
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite')
    const store = tx.objectStore(SNAPSHOTS_STORE)
    const snapshot: ProjectSnapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: project.id,
      project: structuredClone(project),
      label: label || new Date().toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' }),
      createdAt: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const request = store.put(snapshot)
      request.onsuccess = () => resolve(snapshot)
      request.onerror = () => reject(request.error)
    })
  }

  async getSnapshots(projectId: string): Promise<ProjectSnapshot[]> {
    const db = await openDB()
    const tx = db.transaction(SNAPSHOTS_STORE, 'readonly')
    const store = tx.objectStore(SNAPSHOTS_STORE)
    const index = store.index('projectId')

    return new Promise((resolve, reject) => {
      const request = index.getAll(projectId)
      request.onsuccess = () => {
        const results = request.result || []
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        resolve(results)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async deleteSnapshot(id: string): Promise<void> {
    const db = await openDB()
    const tx = db.transaction(SNAPSHOTS_STORE, 'readwrite')
    const store = tx.objectStore(SNAPSHOTS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const storageService = new StorageService()
