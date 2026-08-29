import { useEffect, useRef } from 'react'
import { useProjectStore } from '@/stores/project-store'
import { useEditorStore } from '@/stores/editor-store'
import { getMaplibregl } from '@/lib/maplibre'

function isLayerVisible(project: any, layerId: string): boolean {
  if (!project) return false
  const layer = project.layers.find((l: any) => l.id === layerId)
  return layer ? layer.visible : true
}

const imageCache = new Map<string, HTMLImageElement>()

function ensureImage(url: string, cb: (img: HTMLImageElement) => void) {
  const cached = imageCache.get(url)
  if (cached && cached.complete && cached.naturalWidth) {
    cb(cached)
    return
  }
  if (cached && !cached.complete) {
    cached.addEventListener('load', () => cb(cached), { once: true })
    return
  }
  const im = new Image()
  im.crossOrigin = 'anonymous'
  im.onload = () => {
    imageCache.set(url, im)
    cb(im)
  }
  im.onerror = () => {
    const im2 = new Image()
    im2.onload = () => {
      imageCache.set(url, im2)
      cb(im2)
    }
    im2.src = url
  }
  im.src = url
}

function drawCropped(canvas: HTMLCanvasElement, img: HTMLImageElement, cw: number, ch: number, cropX: number, cropY: number) {
  const dpr = window.devicePixelRatio || 1
  const W = Math.max(1, Math.round(cw * dpr))
  const H = Math.max(1, Math.round(ch * dpr))
  if (canvas.width !== W) canvas.width = W
  if (canvas.height !== H) canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, W, H)
  if (!img.naturalWidth) return
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  const dx = (W - dw) * (cropX / 100)
  const dy = (H - dh) * (cropY / 100)
  ctx.drawImage(img, dx, dy, dw, dh)
}

export function useMapImages(mapRef: React.RefObject<any>) {
  const imagesRef = useRef<Map<string, any>>(new Map())
  const { project, updateImage } = useProjectStore()
  const { selectedElementId, setSelectedElement } = useEditorStore()

  useEffect(() => {
    if (!mapRef.current || !project) return

    const map = mapRef.current
    const currentImages = imagesRef.current
    const maplibregl = getMaplibregl()

    // Remove images that no longer exist
    currentImages.forEach((marker, id) => {
      if (!project.images.find((img) => img.id === id)) {
        marker.remove()
        currentImages.delete(id)
      }
    })

    // Add or update images
    project.images.forEach((imageData) => {
      // Hide if element is not visible OR its layer is not visible
      if (!imageData.visible || !isLayerVisible(project, imageData.layerId)) {
        const existingImage = currentImages.get(imageData.id)
        if (existingImage) {
          existingImage.remove()
          currentImages.delete(imageData.id)
        }
        return
      }

      const shape = imageData.shape ?? 'rectangle'
      const renderH = shape === 'square' ? imageData.width : imageData.height
      const radius = shape === 'circle' ? '50%' : `${imageData.cornerRadius ?? 0}px`
      const borderWidth = imageData.borderWidth ?? 0
      const borderColor = imageData.borderColor ?? '#000000'
      const shadow = imageData.shadow ?? 0
      const shadowColor = imageData.shadowColor ?? '#000000'
      const border = borderWidth > 0 ? `${borderWidth}px solid ${borderColor}` : 'none'
      const boxShadow = shadow > 0 ? `0 1px ${shadow}px ${shadowColor}` : 'none'
      const cropX = imageData.cropX ?? 50
      const cropY = imageData.cropY ?? 50

      const applyStyle = (node: HTMLElement) => {
        node.style.width = `${imageData.width}px`
        node.style.height = `${renderH}px`
        node.style.borderRadius = radius
        node.style.border = border
        node.style.boxShadow = boxShadow
        node.style.transform = `rotate(${imageData.rotation}deg)`
        node.style.opacity = `${imageData.opacity}`
        node.style.display = 'block'
        node.style.pointerEvents = 'none'
      }

      let marker = currentImages.get(imageData.id)

      if (!marker) {
        const el = document.createElement('div')
        el.className = 'custom-image-marker'
        el.style.cursor = 'grab'
        el.style.userSelect = 'none'

        const canvas = document.createElement('canvas')
        canvas.className = 'img-inner'
        applyStyle(canvas)
        el.appendChild(canvas)

        marker = new maplibregl.Marker({ element: el, draggable: true })
          .setLngLat(imageData.coordinates)
          .addTo(map)

        el.addEventListener('click', (e: Event) => {
          e.stopPropagation()
          setSelectedElement(imageData.id)
        })

        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          updateImage(imageData.id, { coordinates: [lngLat.lng, lngLat.lat] })
        })

        currentImages.set(imageData.id, marker)

        ensureImage(imageData.url, (img) => drawCropped(canvas, img, imageData.width, renderH, cropX, cropY))
      } else {
        marker.setLngLat(imageData.coordinates)

        const el = marker.getElement()
        const inner = el.querySelector('.img-inner') as HTMLCanvasElement | null
        if (inner) {
          applyStyle(inner)
          ensureImage(imageData.url, (img) => drawCropped(inner, img, imageData.width, renderH, cropX, cropY))
        }
      }
    })
  }, [project?.images, project?.layers, mapRef, setSelectedElement, updateImage])

  useEffect(() => {
    imagesRef.current.forEach((marker, id) => {
      const el = marker.getElement()
      el.style.cursor = 'grab'
    })
  }, [selectedElementId])
}
