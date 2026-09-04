import { X, MousePointer2, MapPin, Navigation, Route, Pentagon, Type, Image, Layers, Palette, Undo2, Save, Download, Maximize, Clock, Copy, Pencil, CircleDot } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useModalAccessibility } from '@/hooks/use-modal-accessibility'

const TOOLS = [
  { icon: MousePointer2, label: 'Seleccionar', desc: 'Selecciona elementos del mapa para editarlos.', shortcut: 'V' },
  { icon: MapPin, label: 'Añadir punto', desc: 'Haz clic en el mapa para colocar un marcador (POI). Puedes elegir icono, color y tamaño en el panel de propiedades.', shortcut: 'M' },
  { icon: Navigation, label: 'Ruta A-B', desc: 'Calcula una ruta automática entre dos puntos usando OSRM. Selecciona modo de transporte (auto, bici, pie) y se dibuja la ruta más corta.', shortcut: 'A' },
  { icon: Route, label: 'Dibujar línea', desc: 'Traza una línea a mano alzada haciendo clic en el mapa. Doble clic para finalizar. Ideal para senderos y recorridos.', shortcut: 'L' },
  { icon: Pentagon, label: 'Dibujar forma', desc: 'Crea polígonos cerrados haciendo clic en el mapa. Doble clic para cerrar la forma. Útil para áreas y zonas.', shortcut: 'P' },
  { icon: Type, label: 'Añadir texto', desc: 'Haz clic en el mapa para colocar una etiqueta de texto personalizada. Controla fuente, tamaño, color y alineación.', shortcut: 'T' },
  { icon: Image, label: 'Añadir imagen', desc: 'Inserta una imagen georreferenciada en el mapa. Puedes usar un archivo local o una URL. Soporta recorte, forma y bordes.', shortcut: 'I' },
]

const ACTIONS = [
  { icon: Undo2, label: 'Deshacer / Rehacer', desc: 'Deshaz o rehaz el último cambio. También funciona con Ctrl+Z y Ctrl+Shift+Z.' },
  { icon: Save, label: 'Guardar', desc: 'Guarda el proyecto actual en el navegador (IndexedDB). También se guarda automáticamente.' },
  { icon: Copy, label: 'Guardar como', desc: 'Crea una copia del proyecto con un nombre nuevo. El original no se modifica.' },
  { icon: Clock, label: 'Historial de versiones', desc: 'Guarda snapshots del proyecto para poder restaurar versiones anteriores.' },
  { icon: Download, label: 'Exportar', desc: 'Descarga tu mapa como imagen (PNG/JPG), PDF o archivo de proyecto (.mapora).' },
  { icon: Maximize, label: 'Ajustar vista', desc: 'Ajusta el zoom y centro del mapa para ver todos los elementos del proyecto a la vez.' },
  { icon: Pencil, label: 'Renombrar proyecto', desc: 'Haz clic en el nombre del proyecto junto al botón Exportar para editarlo.' },
]

const LAYERS_INFO = [
  { icon: Layers, label: 'Capas', desc: 'Organiza elementos en capas. Cada capa puede tener color, visibilidad y nombre propio. Los elementos se anidan bajo su capa.' },
  { icon: Palette, label: 'Estilos de mapa', desc: 'Cambia entre Estándar, Claro, Oscuro, Turístico, OpenStreetMap y OpenTopoMap desde la barra de estado.' },
]

export function HelpModal() {
  const { helpModalOpen, setHelpModalOpen } = useUIStore()
  const dialogRef = useModalAccessibility(helpModalOpen, () => setHelpModalOpen(false))

  if (!helpModalOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="help-modal-title" tabIndex={-1} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col outline-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <h2 id="help-modal-title" className="text-lg font-bold text-slate-800">Ayuda — Herramientas</h2>
          <button onClick={() => setHelpModalOpen(false)} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Herramientas de dibujo</h3>
            <div className="space-y-2">
              {TOOLS.map((tool) => (
                <div key={tool.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <tool.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">{tool.label}</p>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">{tool.shortcut}</kbd>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500 mt-0.5">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Edición de nodos</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <CircleDot className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Modificar rutas y formas</p>
                  <p className="text-xs leading-relaxed text-slate-500 mt-0.5">Al seleccionar una ruta o forma, aparecen puntos (nodos) en cada vértice. Arrastra un nodo para moverlo. Haz doble clic en la línea para insertar un nuevo nodo entre los más cercanos.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <span className="text-lg font-bold">×</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Eliminar nodos</p>
                  <p className="text-xs leading-relaxed text-slate-500 mt-0.5">Selecciona un nodo con clic normal. Usa <kbd className="px-1 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">Shift+clic</kbd> para seleccionar varios nodos. Luego pulsa <kbd className="px-1 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 rounded">Supr</kbd> o haz clic en el botón rojo × para eliminarlos.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACTIONS.map((action) => (
                <div key={action.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{action.label}</p>
                    <p className="text-xs leading-relaxed text-slate-500 mt-0.5">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Organización</h3>
            <div className="space-y-2">
              {LAYERS_INFO.map((item) => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                    <p className="text-xs leading-relaxed text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl bg-blue-50 border border-blue-100 p-4">
            <h3 className="text-sm font-bold text-blue-800 mb-2">Atajos de teclado</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-blue-700">
              <span><kbd className="font-mono font-bold">Ctrl+Z</kbd> Deshacer</span>
              <span><kbd className="font-mono font-bold">Ctrl+Shift+Z</kbd> Rehacer</span>
              <span><kbd className="font-mono font-bold">Ctrl+S</kbd> Guardar</span>
              <span><kbd className="font-mono font-bold">Ctrl+E</kbd> Exportar</span>
              <span><kbd className="font-mono font-bold">V</kbd> Seleccionar</span>
              <span><kbd className="font-mono font-bold">M</kbd> Marcador</span>
              <span><kbd className="font-mono font-bold">A</kbd> Ruta A-B</span>
              <span><kbd className="font-mono font-bold">L</kbd> Línea</span>
              <span><kbd className="font-mono font-bold">P</kbd> Polígono</span>
              <span><kbd className="font-mono font-bold">T</kbd> Texto</span>
              <span><kbd className="font-mono font-bold">I</kbd> Imagen</span>
              <span><kbd className="font-mono font-bold">Esc</kbd> Deseleccionar</span>
              <span><kbd className="font-mono font-bold">Supr</kbd> Eliminar nodos seleccionados</span>
              <span><kbd className="font-mono font-bold">Shift+clic</kbd> Selección múltiple de nodos</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
