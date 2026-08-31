import { useEffect, useState } from 'react'
import { X, Clock, RotateCcw, Trash2, Save } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useVersionStore } from '@/stores/version-store'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useModalAccessibility } from '@/hooks/use-modal-accessibility'

export function VersionHistoryModal() {
  const { versionHistoryOpen, setVersionHistoryOpen } = useUIStore()
  const { snapshots, loading, loadSnapshots, saveSnapshot, restoreSnapshot, deleteSnapshot } = useVersionStore()
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; label: string }>({ show: false, id: '', label: '' })
  const dialogRef = useModalAccessibility(versionHistoryOpen, () => setVersionHistoryOpen(false))

  useEffect(() => {
    if (versionHistoryOpen) loadSnapshots()
  }, [versionHistoryOpen, loadSnapshots])

  if (!versionHistoryOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="version-modal-title" tabIndex={-1} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 id="version-modal-title" className="text-lg font-bold text-slate-800">Historial de versiones</h2>
          </div>
          <button onClick={() => setVersionHistoryOpen(false)} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4">
          <button
            onClick={() => saveSnapshot()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <Save className="h-4 w-4" />
            Guardar snapshot actual
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto px-6 pb-4">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Cargando versiones...</div>
          ) : snapshots.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No hay snapshots guardados. Crea uno para poder restaurar versiones anteriores.
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snapshot, i) => (
                <div
                  key={snapshot.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {snapshots.length - i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{snapshot.label}</p>
                    <p className="text-xs text-slate-400">{snapshot.project.name}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => restoreSnapshot(snapshot)}
                      className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                      title="Restaurar esta versión"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ show: true, id: snapshot.id, label: snapshot.label })}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors"
                      title="Eliminar snapshot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.show}
        title="Eliminar snapshot"
        message={`¿Eliminar el snapshot "${deleteConfirm.label}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
        onConfirm={() => { deleteSnapshot(deleteConfirm.id); setDeleteConfirm({ show: false, id: '', label: '' }) }}
        onCancel={() => setDeleteConfirm({ show: false, id: '', label: '' })}
      />
    </div>
  )
}
