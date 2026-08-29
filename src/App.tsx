import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { PropertiesPanel } from '@/components/panels/PropertiesPanel'
import { MapLibreMap } from '@/components/map/MapLibreMap'
import { SearchBar } from '@/components/map/SearchBar'
import { ExportModal } from '@/components/export/ExportModal'
import { NewProjectModal } from '@/components/projects/NewProjectModal'
import { LandingPage } from '@/components/welcome/LandingPage'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore, defaultLayers, defaultLayerId } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { useMapStore } from '@/stores/map-store'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useAutoSave } from '@/hooks/use-auto-save'
import { useHistoryRecorder } from '@/hooks/use-history-recorder'
import { storageService } from '@/services/storage'
import { pickLatestProject } from '@/lib/project-view'
import type { MapProject } from '@/types/map'

function createDefaultProject(): MapProject {
  return {
    id: `project-${Date.now()}`,
    name: 'Mi mapa turístico',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    map: {
      center: [-72.545, -13.163],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      style: 'standard',
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
      position: 'bottom-right',
    },
    exportSettings: {
      format: 'png',
      width: 1920,
      height: 1080,
      quality: 90,
      includeLegend: true,
      includeScale: true,
      includeNorth: true,
      includeTitle: true,
    },
  }
}

function EditorApp() {
  const { sidebarOpen, propertiesPanelOpen, setSearchOpen } = useUIStore()
  const { project, setProject } = useProjectStore()
  const { setActiveLayer, resetHistory } = useEditorStore()

  useKeyboardShortcuts()
  useAutoSave()
  useHistoryRecorder()

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      try {
        const projects = await storageService.getAllProjects()
        if (cancelled) return

        let nextProject: MapProject

        if (projects.length > 0) {
          const latest = pickLatestProject(projects)
          nextProject = latest!
        } else {
          nextProject = createDefaultProject()
        }

        if (cancelled) return
        setProject(nextProject)
        resetHistory(nextProject)
        setActiveLayer(nextProject.layers[0]?.id ?? null)

        const mapStore = useMapStore.getState()
        mapStore.setStyle(nextProject.map.style)
        mapStore.setCenter(nextProject.map.center)
        mapStore.setZoom(nextProject.map.zoom)
        mapStore.setPitch(nextProject.map.pitch)
        mapStore.setBearing(nextProject.map.bearing)
      } catch (error) {
        console.error('Error loading project:', error)
        if (!cancelled) {
          const fallback = createDefaultProject()
          setProject(fallback)
          resetHistory(fallback)
          setActiveLayer(defaultLayerId)
        }
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [setProject, setActiveLayer, resetHistory])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setSearchOpen])

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar isOpen={sidebarOpen} />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          <MapLibreMap />
          <SearchBar />
        </main>

        <PropertiesPanel isOpen={propertiesPanelOpen} />
      </div>

      <StatusBar />

      <ExportModal />
      <NewProjectModal />
    </div>
  )
}

function App() {
  const [route, setRoute] = useState<'landing' | 'editor'>(() =>
    window.location.hash === '#/editor' ? 'editor' : 'landing'
  )

  useEffect(() => {
    const onHash = () => {
      setRoute(window.location.hash === '#/editor' ? 'editor' : 'landing')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === 'editor') return <EditorApp />

  return <LandingPage onEnter={() => { window.location.hash = '#/editor' }} />
}

export default App
