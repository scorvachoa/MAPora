import {
  MousePointer2,
  MapPin,
  Navigation,
  Route,
  Pentagon,
  Type,
  Image,
  Layers,
  Palette,
  Download,
  Save,
  Undo2,
  Compass,
  ArrowRight,
  Map as MapIcon,
  Sparkles,
} from 'lucide-react'
import { ReferenceMapPreview } from './ReferenceMapPreview'

const TOOLS = [
  { icon: MousePointer2, label: 'Seleccionar', desc: 'Elige y edita elementos del mapa.' },
  { icon: MapPin, label: 'Añadir punto', desc: 'Marca sitios de interés (POI).' },
  { icon: Navigation, label: 'Ruta A-B', desc: 'Calcula una ruta entre dos puntos.' },
  { icon: Route, label: 'Dibujar línea', desc: 'Traza senderos y recorridos a mano.' },
  { icon: Pentagon, label: 'Dibujar forma', desc: 'Crea áreas y polígonos.' },
  { icon: Type, label: 'Añadir texto', desc: 'Etiquetas y títulos personalizados.' },
  { icon: Image, label: 'Añadir imagen', desc: 'Inserta fotos o superposiciones.' },
]

const FEATURES = [
  { icon: Layers, label: 'Capas organizadas', desc: 'Agrupa puntos y rutas por tema, con colores y visibilidad.' },
  { icon: Palette, label: 'Estilos de mapa', desc: 'Estándar, claro, oscuro, turístico, OpenStreetMap y topográfico.' },
  { icon: Undo2, label: 'Historial', desc: 'Deshaz y rehaz cualquier cambio al instante.' },
  { icon: Save, label: 'Guardado automático', desc: 'Tu proyecto se guarda en el navegador y puedes exportarlo.' },
  { icon: Download, label: 'Exportar', desc: 'Descarga tu mapa como imagen o PDF.' },
  { icon: Compass, label: 'Vistas precisas', desc: 'Controla zoom, inclinación y norte de forma exacta.' },
]

const STEPS = [
  'Selecciona una herramienta en la barra lateral izquierda.',
  'Haz clic en el mapa para colocar puntos o trazar rutas.',
  'Organiza todo en capas y elige el estilo visual.',
  'Exporta tu mapa turístico final con un solo clic.',
]

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="h-screen overflow-y-auto bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30">
              <MapIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-800">MAPORA</span>
          </div>
          <button
            onClick={onEnter}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/30 transition-all hover:to-blue-600 hover:shadow-lg active:scale-95"
          >
            Entrar al editor
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              <Sparkles className="h-3.5 w-3.5" />
              Creador de mapas turísticos
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              Diseña mapas turísticos{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                profesionales
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-500">
              Marca sitios de interés, traza rutas, organízalos en capas y expórtalos como
              imagen o PDF. Todo desde el navegador, sin instalar nada.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={onEnter}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:to-blue-600 hover:shadow-xl active:scale-95"
              >
                Entrar al editor
                <ArrowRight className="h-5 w-5" />
              </button>
              <a
                href="#como-funciona"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
              >
                Cómo funciona
              </a>
            </div>
          </div>

          <div className="relative h-80 w-full overflow-hidden rounded-2xl ring-1 ring-slate-200 lg:h-[26rem]">
            <ReferenceMapPreview />
          </div>
        </section>

        <section className="pb-16">
          <h2 className="mb-5 text-center text-2xl font-bold tracking-tight text-slate-800">
            Todo lo que necesitas en un solo lugar
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{f.label}</p>
                  <p className="text-xs leading-snug text-slate-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="herramientas" className="scroll-mt-20 pb-16">
          <h2 className="mb-5 text-center text-2xl font-bold tracking-tight text-slate-800">
            Herramientas
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TOOLS.map((t) => (
              <div
                key={t.label}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:border-blue-200 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t.label}</p>
                  <p className="text-xs leading-snug text-slate-500">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="scroll-mt-20 pb-20">
          <h2 className="mb-5 text-center text-2xl font-bold tracking-tight text-slate-800">
            Cómo funciona
          </h2>
          <ol className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <p className="pt-1 text-sm leading-snug text-slate-600">{s}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex justify-center">
            <button
              onClick={onEnter}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:to-blue-600 hover:shadow-xl active:scale-95"
            >
              Empieza ahora
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-slate-400">
          MAPORA · Creador de mapas turísticos · Hecho para explorar y compartir el mundo
        </div>
      </footer>
    </div>
  )
}
