import type { MapProject } from '@/types/map'

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
        } catch (error) {
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
    if (!data.id || !data.name) return false
    if (!data.map || !data.layers || !data.markers) return false
    return true
  }
}

export const maporaFileService = new MaporaFileService()
