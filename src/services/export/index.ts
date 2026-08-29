import type { ExportSettings } from '@/types/map'

export class ExportService {
  async exportPNG(
    canvas: HTMLCanvasElement,
    settings: ExportSettings
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Error exportando PNG'))
        },
        'image/png',
        1
      )
    })
  }

  async exportJPG(
    canvas: HTMLCanvasElement,
    settings: ExportSettings
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Error exportando JPG'))
        },
        'image/jpeg',
        settings.quality / 100
      )
    })
  }

  downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async exportPNGToFile(
    canvas: HTMLCanvasElement,
    settings: ExportSettings,
    filename: string
  ): Promise<void> {
    const blob = await this.exportPNG(canvas, settings)
    this.downloadBlob(blob, filename)
  }

  async exportJPGToFile(
    canvas: HTMLCanvasElement,
    settings: ExportSettings,
    filename: string
  ): Promise<void> {
    const blob = await this.exportJPG(canvas, settings)
    this.downloadBlob(blob, filename)
  }
}

export const exportService = new ExportService()
