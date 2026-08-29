import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getMapStyleSpec } from '@/constants/map-styles'

const CUSCO_PLAZA_ARMAS: [number, number] = [-71.9675, -13.532]

function makeBrandMarker(): HTMLDivElement {
  const el = document.createElement('div')
  el.style.cssText =
    'width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:14px;' +
    'background:linear-gradient(135deg,#3b82f6,#2563eb);box-shadow:0 6px 16px rgba(37,99,235,0.45);' +
    'border:3px solid #fff;'
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106Z"/>
      <path d="M15 5.764v15"/>
      <path d="M9 3.236v15"/>
    </svg>`
  return el
}

export function ReferenceMapPreview() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: getMapStyleSpec('standard'),
      center: CUSCO_PLAZA_ARMAS,
      zoom: 16,
      attributionControl: false,
    })

    map.on('load', () => {
      new maplibregl.Marker({ element: makeBrandMarker() })
        .setLngLat(CUSCO_PLAZA_ARMAS)
        .addTo(map)
    })

    return () => map.remove()
  }, [])

  return <div ref={containerRef} className="absolute inset-0" />
}
