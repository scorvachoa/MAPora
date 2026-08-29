import { useMapStore } from '@/stores/map-store'
import { useProjectStore } from '@/stores/project-store'
import { MAP_STYLE_NAMES } from '@/constants/map-styles'
import { ChevronDown, ZoomIn, Compass, Crosshair } from 'lucide-react'
import type { MapStyle } from '@/types/map'

const STYLE_ORDER: MapStyle[] = ['standard', 'light', 'dark', 'tourist', 'osm', 'topo']

export function StatusBar() {
  const { settings, setStyle } = useMapStore()
  const { project, updateProject } = useProjectStore()

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const style = e.target.value as MapStyle
    setStyle(style)
    if (project) {
      updateProject({ map: { ...project.map, style } })
    }
  }

  const [lng, lat] = settings.center

  return (
    <footer className="h-10 bg-white border-t border-slate-200 flex items-center px-4 gap-4 text-xs text-slate-500 shrink-0 shadow-[0_-1px_2px_rgba(15,23,42,0.03)] z-20">
      <div className="flex items-center gap-1.5" title="Coordenadas del centro">
        <Crosshair className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-mono text-[11px] text-slate-600 tabular-nums">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <div className="flex items-center gap-1.5" title="Nivel de zoom">
        <ZoomIn className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-700 tabular-nums">{settings.zoom.toFixed(1)}</span>
        <span className="text-slate-400">zoom</span>
      </div>

      <div className="h-4 w-px bg-slate-200" />

      <div className="flex items-center gap-1.5">
        <span className="text-slate-400">Estilo</span>
        <div className="relative">
          <select
            value={settings.style}
            onChange={handleStyleChange}
            className="appearance-none text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-transparent hover:border-slate-300 rounded-lg pl-2.5 pr-7 py-1 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            {STYLE_ORDER.map((s) => (
              <option key={s} value={s}>
                {MAP_STYLE_NAMES[s]}
              </option>
            ))}
          </select>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5" title="Indicador norte">
        <span className="text-slate-400 hidden sm:inline">Norte</span>
        <Compass
          className="h-4 w-4 text-blue-600 transition-transform duration-300 ease-out"
          style={{ transform: `rotate(${-settings.bearing}deg)` }}
        />
      </div>
    </footer>
  )
}
