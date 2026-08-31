import { useState } from 'react'
import { X } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { storageService } from '@/services/storage'
import { useModalAccessibility } from '@/hooks/use-modal-accessibility'

export function DuplicateProjectModal() {
  const { duplicateProjectModalOpen, setDuplicateProjectModalOpen } = useUIStore()
  const { project, setProject } = useProjectStore()
  const { resetHistory } = useEditorStore()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useModalAccessibility(duplicateProjectModalOpen, () => setDuplicateProjectModalOpen(false))

  if (!duplicateProjectModalOpen || !project) return null

  const defaultName = `${project.name} (copia)`
  const value = name || defaultName

  const handleDuplicate = async () => {
    if (!value.trim()) return
    setSaving(true)
    try {
      const newProject = await storageService.duplicateProject(project, value.trim())
      setProject(newProject)
      resetHistory(newProject)
      setName('')
      setDuplicateProjectModalOpen(false)
    } catch (error) {
      console.error('Error duplicating project:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setName('')
    setDuplicateProjectModalOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="duplicate-modal-title" tabIndex={-1} className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="duplicate-modal-title" className="text-lg font-bold text-slate-800">Guardar como</h2>
          <button onClick={handleClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del proyecto</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultName}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleDuplicate() }}
          />
          <p className="mt-2 text-xs text-slate-400">
            Se creará una copia con un nuevo ID. El proyecto original no se modifica.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleDuplicate}
            disabled={saving || !value.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl shadow-md shadow-blue-500/30 hover:shadow-lg hover:to-blue-600 disabled:opacity-50 transition-all"
          >
            {saving ? 'Guardando...' : 'Guardar copia'}
          </button>
        </div>
      </div>
    </div>
  )
}
