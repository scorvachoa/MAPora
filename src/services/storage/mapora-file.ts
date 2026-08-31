import type { MapProject } from '@/types/map'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export class MaporaFileService {
  exportToFile(project: MapProject): void {
    const data = JSON.stringify(project, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.mapora`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async importFromFile(file: File): Promise<MapProject> {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('El archivo excede el tamaño máximo de 10 MB')
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (!this.validateMaporaFile(data)) {
            reject(new Error('Archivo .mapora inválido'))
            return
          }
          resolve(data as MapProject)
        } catch {
          reject(new Error('Error al leer el archivo'))
        }
      }
      reader.onerror = () => reject(new Error('Error al leer el archivo'))
      reader.readAsText(file)
    })
  }

  private validateMaporaFile(data: any): boolean {
    if (!data || typeof data !== 'object') return false
    if (data.version !== 1) return false
    if (!data.id || typeof data.id !== 'string') return false
    if (!data.name || typeof data.name !== 'string') return false
    if (!data.map || typeof data.map !== 'object') return false
    if (!Array.isArray(data.layers)) return false
    if (!Array.isArray(data.markers)) return false
    if (!Array.isArray(data.routes)) return false
    if (!Array.isArray(data.shapes)) return false
    if (!Array.isArray(data.texts)) return false
    if (!Array.isArray(data.images)) return false
    return true
  }
}

export const maporaFileService = new MaporaFileService()
