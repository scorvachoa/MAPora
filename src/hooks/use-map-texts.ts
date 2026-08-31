import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { getMaplibregl } from '@/lib/maplibre'
import { isLayerVisible } from '@/lib/layer-utils'

export function useMapTexts(mapRef: React.RefObject<any>) {
  const textsRef = useRef<Map<string, any>>(new Map())
  const { project, updateText } = useProjectStore()
  const { selectedElementId, setSelectedElement } = useEditorStore()

  useEffect(() => {
    if (!mapRef.current || !project) return

    const map = mapRef.current
    const currentTexts = textsRef.current
    const maplibregl = getMaplibregl()

    // Remove texts that no longer exist
    currentTexts.forEach((marker, id) => {
      if (!project.texts.find((t) => t.id === id)) {
        marker.remove()
        currentTexts.delete(id)
      }
    })

    // Add or update texts
    project.texts.forEach((textData) => {
      // Hide if element is not visible OR its layer is not visible
      if (!textData.visible || !isLayerVisible(project, textData.layerId)) {
        const existingText = currentTexts.get(textData.id)
        if (existingText) {
          existingText.remove()
          currentTexts.delete(textData.id)
        }
        return
      }

      let marker = currentTexts.get(textData.id)

      if (!marker) {
        const shadow = textData.shadow ?? 4
        const shadowColor = textData.shadowColor ?? '#000000'
        const el = document.createElement('div')
        el.className = 'custom-text'
        el.style.cursor = 'grab'
        el.style.whiteSpace = 'nowrap'
        el.style.userSelect = 'none'

        const inner = document.createElement('div')
        inner.style.fontSize = `${textData.fontSize}px`
        inner.style.fontWeight = textData.fontWeight
        inner.style.fontFamily = textData.fontFamily
        inner.style.color = textData.color
        inner.style.textAlign = textData.alignment
        inner.style.transform = `rotate(${textData.rotation}deg)`
        inner.style.whiteSpace = 'pre-wrap'
        if (textData.backgroundColor) {
          inner.style.backgroundColor = textData.backgroundColor
          inner.style.padding = '2px 4px'
          inner.style.borderRadius = '2px'
        }
        if (textData.borderColor) {
          inner.style.border = `1px solid ${textData.borderColor}`
        }
        if (shadow > 0) {
          inner.style.textShadow = `0 1px ${shadow}px ${shadowColor}`
        }
        inner.textContent = textData.content
        el.appendChild(inner)

        marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat(textData.coordinates)
          .addTo(map)

        el.addEventListener('click', (e: Event) => {
          e.stopPropagation()
          setSelectedElement(textData.id)
        })

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          updateText(textData.id, { coordinates: [lngLat.lng, lngLat.lat] })
        })

        currentTexts.set(textData.id, marker)
      } else {
        const shadow = textData.shadow ?? 4
        const shadowColor = textData.shadowColor ?? '#000000'
        const el = marker.getElement()
        const innerDiv = el.querySelector('div')
        if (innerDiv) {
          innerDiv.style.fontSize = `${textData.fontSize}px`
          innerDiv.style.fontWeight = textData.fontWeight
          innerDiv.style.fontFamily = textData.fontFamily
          innerDiv.style.color = textData.color
          innerDiv.style.textAlign = textData.alignment
          innerDiv.style.transform = `rotate(${textData.rotation}deg)`
          innerDiv.style.whiteSpace = 'pre-wrap'
          innerDiv.style.textShadow = shadow > 0 ? `0 1px ${shadow}px ${shadowColor}` : 'none'
          innerDiv.textContent = textData.content
        }
        marker.setLngLat(textData.coordinates)
      }
    })
  }, [project?.texts, project?.layers, mapRef, setSelectedElement, updateText])

  useEffect(() => {
    textsRef.current.forEach((marker) => {
      const el = marker.getElement()
      el.style.cursor = 'grab'
    })
  }, [selectedElementId])
}
