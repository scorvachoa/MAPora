import { useRef, useState, type ChangeEvent } from 'react'

interface ImageSourceModalProps {
  open: boolean
  mode: 'new' | 'edit'
  onLocalFile: (file: File) => void
  onUrl: (url: string) => void
  onClose: () => void
}

export function ImageSourceModal({ open, mode, onLocalFile, onUrl, onClose }: ImageSourceModalProps) {
  const [url, setUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onLocalFile(file)
  }

  const handleUrlSubmit = () => {
    const trimmed = url.trim()
    if (!trimmed) {
      setUrlError('Ingresa una URL válida')
      return
    }
    onUrl(trimmed)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-[400px] max-w-[90vw] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          {mode === 'edit' ? 'Cambiar imagen' : 'Añadir imagen'}
        </h2>
        <p className="text-sm text-gray-500 mb-5">Elige una fuente para la imagen.</p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3 mb-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-left"
        >
          <span className="text-2xl">🖼️</span>
          <span>
            <span className="block font-medium text-gray-800">Desde archivo local</span>
            <span className="block text-xs text-gray-500">Sube una imagen desde tu dispositivo</span>
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="border border-gray-200 rounded-xl p-4">
          <label className="block text-sm font-medium text-gray-800 mb-2">Desde URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setUrlError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit() }}
            placeholder="https://ejemplo.com/imagen.png"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {urlError && <p className="text-xs text-red-500 mt-1">{urlError}</p>}
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="mt-3 w-full px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Cargar desde URL
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
