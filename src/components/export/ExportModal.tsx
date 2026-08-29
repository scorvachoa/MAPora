import { useState } from 'react'
import { X, Download, FileImage, FileText } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { getMapInstance } from '@/lib/map-instance'

export function ExportModal() {
  const { exportModalOpen, setExportModalOpen, setLoadingMessage } = useUIStore()
  const { project } = useProjectStore()
  const [format, setFormat] = useState<'png' | 'jpg' | 'svg' | 'pdf'>('png')
  const [width, setWidth] = useState(1920)
  const [height, setHeight] = useState(1080)
  const [quality, setQuality] = useState(90)

  if (!exportModalOpen) return null

  const handleExport = async () => {
    setLoadingMessage('Preparando exportación...')

    const loadImage = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })

    try {
      const container = document.querySelector('.maplibregl-map') as HTMLElement | null
      if (!container) throw new Error('No se encontró el mapa')

      const cw = container.clientWidth
      const ch = container.clientHeight
      const baseName = project?.name || 'mapa'

      const mapCanvas = container.querySelector('canvas') as HTMLCanvasElement | null
      const controls = container.querySelector('.maplibregl-control-container') as HTMLElement | null

      const scale = Math.max(width / cw, height / ch)
      const iw = Math.round(cw * scale)
      const ih = Math.round(ch * scale)

      // 1) Capa base + vectores (ríos, líneas, rutas, formas) desde el canvas WebGL
      let baseImg: HTMLImageElement | null = null
      try {
        const map = getMapInstance()
        if (map) {
          await new Promise<void>((resolve) => {
            let done = false
            const onRender = () => {
              if (done) return
              done = true
              map.off('render', onRender)
              resolve()
            }
            map.on('render', onRender)
            map.triggerRepaint()
            setTimeout(resolve, 800)
          })
        }
        const srcCanvas = (map?.getCanvas?.() as HTMLCanvasElement) || mapCanvas
        if (srcCanvas) baseImg = await loadImage(srcCanvas.toDataURL('image/png'))
      } catch {
        baseImg = null
      }

      // 2) Overlays DOM (marcadores, textos, imágenes, leyenda) sin el canvas base
      if (controls) controls.style.display = 'none'
      if (mapCanvas) mapCanvas.style.visibility = 'hidden'
      const { default: html2canvas } = await import('html2canvas')
      const overlayCanvas = await html2canvas(container, {
        scale,
        backgroundColor: null,
        logging: false,
        useCORS: true,
        ignoreElements: (el) => {
          const e = el as HTMLElement
          return e.tagName === 'CANVAS' && e.classList.contains('maplibregl-canvas')
        },
      })
      if (mapCanvas) mapCanvas.style.visibility = ''
      if (controls) controls.style.display = ''

      // 3) Composición en lienzo intermedio (iw x ih) y recorte centrado al tamaño pedido
      const inter = document.createElement('canvas')
      inter.width = iw
      inter.height = ih
      const ictx = inter.getContext('2d')
      if (ictx) {
        if (baseImg) ictx.drawImage(baseImg, 0, 0, iw, ih)
        ictx.drawImage(overlayCanvas, 0, 0)
      }

      const out = document.createElement('canvas')
      out.width = width
      out.height = height
      const ctx = out.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        const sx = (iw - width) / 2
        const sy = (ih - height) / 2
        ctx.drawImage(inter, sx, sy, width, height, 0, 0, width, height)
      }

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF({
          orientation: width > height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [width, height],
        })
        doc.addImage(out.toDataURL('image/png'), 'PNG', 0, 0, width, height)
        doc.save(`${baseName}.pdf`)
      } else if (format === 'svg') {
        const svgNS = 'http://www.w3.org/2000/svg'
        const svg = document.createElementNS(svgNS, 'svg')
        svg.setAttribute('width', String(width))
        svg.setAttribute('height', String(height))
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
        const image = document.createElementNS(svgNS, 'image')
        image.setAttribute('href', out.toDataURL('image/png'))
        image.setAttribute('width', String(width))
        image.setAttribute('height', String(height))
        svg.appendChild(image)
        const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${baseName}.svg`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png'
        const qualityValue = format === 'jpg' ? quality / 100 : undefined
        out.toBlob(
          (blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${baseName}.${format}`
              a.click()
              URL.revokeObjectURL(url)
            }
          },
          mimeType,
          qualityValue,
        )
      }

      setLoadingMessage(null)
      setExportModalOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      setLoadingMessage(null)
      alert('Error al exportar')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={() => setExportModalOpen(false)}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Exportar mapa</h2>
          <button
            onClick={() => setExportModalOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Formato</label>
            <div className="grid grid-cols-4 gap-2">
              {([
                { id: 'png', icon: <FileImage className="h-6 w-6" />, label: 'PNG' },
                { id: 'jpg', icon: <FileImage className="h-6 w-6" />, label: 'JPG' },
                { id: 'svg', icon: <FileImage className="h-6 w-6" />, label: 'SVG' },
                { id: 'pdf', icon: <FileText className="h-6 w-6" />, label: 'PDF' },
              ] as const).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    format === f.id
                      ? 'border-blue-500 bg-blue-50 text-blue-600'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {f.icon}
                  <span className="text-sm font-medium">{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ancho</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                min={100}
                max={7680}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Alto</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                min={100}
                max={4320}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {format === 'jpg' && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Calidad: {quality}%
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Resoluciones</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'HD', w: 1280, h: 720 },
                { label: 'Full HD', w: 1920, h: 1080 },
                { label: '2K', w: 2560, h: 1440 },
                { label: '4K', w: 3840, h: 2160 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setWidth(preset.w)
                    setHeight(preset.h)
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setExportModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>
    </div>
  )
}
