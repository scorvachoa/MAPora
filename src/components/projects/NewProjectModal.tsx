import { useState } from 'react'
import { X, Map } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore, defaultLayers } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { useMapStore } from '@/stores/map-store'

export function NewProjectModal() {
  const { newProjectModalOpen, setNewProjectModalOpen } = useUIStore()
  const { setProject } = useProjectStore()
  const { resetHistory } = useEditorStore()
  const { setStyle } = useMapStore()
  const [name, setName] = useState('Mi mapa turístico')
  const [description, setDescription] = useState('')

  if (!newProjectModalOpen) return null

  const handleCreate = () => {
    const newProject = {
      id: `project-${Date.now()}`,
      name,
      description,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      map: {
        center: [-72.545, -13.163] as [number, number],
        zoom: 13,
        pitch: 0,
        bearing: 0,
        style: 'standard' as const,
      },
      layers: defaultLayers,
      markers: [],
      routes: [],
      texts: [],
      shapes: [],
      images: [],
      legend: {
        visible: false,
        title: 'Leyenda',
        items: [],
        position: 'bottom-right' as const,
      },
      exportSettings: {
        format: 'png' as const,
        width: 1920,
        height: 1080,
        quality: 90,
        includeLegend: true,
        includeScale: true,
        includeNorth: true,
        includeTitle: true,
      },
    }
    
    setProject(newProject)
    resetHistory(newProject)
    setStyle(newProject.map.style)
    setNewProjectModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={() => setNewProjectModalOpen(false)}
      />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Map className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-800">Nuevo mapa</h2>
              <p className="text-sm text-gray-500">Crea un nuevo mapa turístico</p>
            </div>
          </div>
          <button
            onClick={() => setNewProjectModalOpen(false)}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre del mapa</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Ruta Machu Picchu"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Una breve descripción del mapa"
              className="w-full h-20 px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => setNewProjectModalOpen(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Crear mapa
          </button>
        </div>
      </div>
    </div>
  )
}
