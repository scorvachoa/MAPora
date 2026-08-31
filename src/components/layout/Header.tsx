import { useState, useRef, useEffect } from 'react'
import { 
  Map, 
  FilePlus, 
  FolderOpen, 
  Download,
  Save,
  Copy,
  Clock,
  Pencil,
  Undo2, 
  Redo2,
  Menu,
  HelpCircle,
  Maximize,
} from 'lucide-react'
import { useEditorStore } from '@/stores/editor-store'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { useMapStore } from '@/stores/map-store'
import { maporaFileService } from '@/services/storage/mapora-file'
import { mergeViewIntoProject } from '@/lib/project-view'
import { getMapInstance } from '@/lib/map-instance'
import { fitAllElements } from '@/lib/fit-all'

export function Header() {
  const { canUndo, canRedo, undo, redo, resetHistory } = useEditorStore()
  const { toggleSidebar, setNewProjectModalOpen, setExportModalOpen, setDuplicateProjectModalOpen, setVersionHistoryOpen, setHelpModalOpen } = useUIStore()
  const { project, setProject, updateProject } = useProjectStore()
  const { setStyle } = useMapStore()
  const [editingName, setEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingName) nameInputRef.current?.select()
  }, [editingName])

  const startRenaming = () => {
    setEditValue(project?.name || '')
    setEditingName(true)
  }

  const commitRename = () => {
    const trimmed = editValue.trim()
    if (trimmed && project && trimmed !== project.name) {
      updateProject({ name: trimmed })
    }
    setEditingName(false)
  }

  const handleSave = () => {
    if (project) {
      const { settings } = useMapStore.getState()
      const projectToSave = mergeViewIntoProject(project, settings)
      maporaFileService.exportToFile(projectToSave)
    }
  }

  const handleOpen = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.mapora'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const loadedProject = await maporaFileService.importFromFile(file)
          setProject(loadedProject)
          resetHistory(loadedProject)
          setStyle(loadedProject.map.style)
        } catch (error) {
          console.error('Error loading project:', error)
        }
      }
    }
    input.click()
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-3 gap-2 shrink-0 shadow-sm shadow-slate-200/40 z-30">
      <button
        onClick={toggleSidebar}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 active:scale-90"
        title="Menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={() => { window.location.hash = '' }}
        className="flex items-center gap-2.5 pl-1 pr-3 rounded-xl hover:bg-slate-50 transition-all duration-200 active:scale-95"
        title="Volver a la bienvenida"
      >
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/30">
          <Map className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight hidden sm:block">
          <span className="block font-extrabold text-slate-800 tracking-tight text-[15px]">MAPORA</span>
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-[0.12em]">Editor de mapas</span>
        </div>
      </button>

      <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
        <button
          onClick={() => setNewProjectModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-200 active:scale-95"
          title="Nuevo proyecto"
        >
          <FilePlus className="h-4 w-4 text-blue-600" />
          <span className="hidden md:inline">Nuevo</span>
        </button>

        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-200 active:scale-95"
          title="Abrir archivo .mapora"
        >
          <FolderOpen className="h-4 w-4 text-slate-500" />
          <span className="hidden md:inline">Abrir</span>
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-200 active:scale-95"
          title="Guardar (Ctrl+S)"
        >
          <Save className="h-4 w-4 text-slate-500" />
          <span className="hidden md:inline">Guardar</span>
        </button>

        {project && (
          <button
            onClick={() => setDuplicateProjectModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-200 active:scale-95"
            title="Guardar como (duplicar proyecto)"
          >
            <Copy className="h-4 w-4 text-slate-500" />
            <span className="hidden md:inline">Guardar como</span>
          </button>
        )}

        {project && (
          <button
            onClick={() => setVersionHistoryOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 rounded-lg hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all duration-200 active:scale-95"
            title="Historial de versiones"
          >
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="hidden md:inline">Versiones</span>
          </button>
        )}
      </div>

      <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block" />

      <div className="flex items-center gap-0.5 p-1 rounded-xl bg-slate-100">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:shadow-none transition-all duration-200 active:scale-90 enabled:hover:text-blue-600"
          title="Deshacer (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-slate-700 hover:bg-white hover:shadow-sm disabled:opacity-40 disabled:hover:bg-transparent disabled:shadow-none transition-all duration-200 active:scale-90 enabled:hover:text-blue-600"
          title="Rehacer (Ctrl+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>

      <button
        onClick={() => {
          const map = getMapInstance()
          const { project } = useProjectStore.getState()
          if (map && project) fitAllElements(map, project)
        }}
        disabled={!project}
        className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent transition-all duration-200 active:scale-90"
        title="Ajustar vista a todos los elementos"
      >
        <Maximize className="h-4 w-4" />
      </button>

      <div className="flex-1" />

      {project && (
        <div className="hidden lg:flex items-center gap-2 mr-3 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 max-w-64 group">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
          {editingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') setEditingName(false)
              }}
              className="flex-1 min-w-0 text-sm font-medium text-slate-800 bg-white border border-blue-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <button
              onClick={startRenaming}
              className="flex items-center gap-1.5 min-w-0 group/name"
              title="Clic para renombrar"
            >
              <span className="text-sm text-slate-600 truncate font-medium">{project.name}</span>
              <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setHelpModalOpen(true)}
        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 active:scale-90"
        title="Ayuda"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      <button
        onClick={() => setExportModalOpen(true)}
        className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:to-blue-600 transition-all duration-200 active:scale-95"
        title="Exportar mapa"
      >
        <Download className="h-4 w-4" />
        <span>Exportar</span>
      </button>
    </header>
  )
}
