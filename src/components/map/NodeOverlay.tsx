import { useEffect, useState, useCallback, useRef } from 'react'
import { useEditorStore } from '@/stores/editor-store'
import { useProjectStore } from '@/stores/project-store'
import { getMapInstance } from '@/lib/map-instance'
import type { Coordinates } from '@/types/map'

interface Node {
  index: number
  coord: Coordinates
  x: number
  y: number
}

export function NodeOverlay() {
  const { selectedElementId, activeTool, selectedNodeIndices, setSelectedNodeIndices, toggleNodeSelection } = useEditorStore()
  const { project, updateRoute, updateShape } = useProjectStore()
  const [nodes, setNodes] = useState<Node[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const draggingIndexRef = useRef<number | null>(null)
  const offsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const coordsRef = useRef<Coordinates[]>([])
  const dragFrameRef = useRef<number | null>(null)
  const didDragRef = useRef(false)

  const getData = useCallback((): { coords: Coordinates[]; type: 'route' | 'shape'; ringIdx?: number } | null => {
    if (!selectedElementId || !project) return null

    const route = project.routes.find((r) => r.id === selectedElementId)
    if (route) return { coords: route.coordinates, type: 'route' }

    const shape = project.shapes.find((s) => s.id === selectedElementId)
    if (shape) {
      return { coords: shape.coordinates[0] || [], type: 'shape', ringIdx: 0 }
    }

    return null
  }, [selectedElementId, project])

  const projectNodes = useCallback((coords: Coordinates[]) => {
    const map = getMapInstance()
    if (!map) return coords.map((c, i) => ({ index: i, coord: c, x: 0, y: 0 }))
    return coords.map((c, i) => {
      const p = map.project(c)
      return { index: i, coord: c, x: p.x, y: p.y }
    })
  }, [])

  useEffect(() => {
    if (!selectedElementId || activeTool !== 'select') {
      setNodes([])
      setSelectedNodeIndices([])
      return
    }

    const data = getData()
    if (!data || data.coords.length === 0) {
      setNodes([])
      return
    }

    coordsRef.current = [...data.coords]
    setNodes(projectNodes(data.coords))

    const map = getMapInstance()
    if (!map) return

    const refresh = () => {
      if (draggingIndexRef.current !== null) return
      const d = getData()
      if (d) {
        coordsRef.current = [...d.coords]
        setNodes(projectNodes(d.coords))
      }
    }

    map.on('move', refresh)
    map.on('zoom', refresh)
    map.on('resize', refresh)

    return () => {
      map.off('move', refresh)
      map.off('zoom', refresh)
      map.off('resize', refresh)
    }
  }, [selectedElementId, activeTool, getData, projectNodes, setSelectedNodeIndices])

  useEffect(() => {
    if (!isDragging) return

    const map = getMapInstance()
    if (!map) return
    const container = map.getContainer()
    const rect = container.getBoundingClientRect()

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (draggingIndexRef.current === null) return
      if (dragFrameRef.current) return

      dragFrameRef.current = requestAnimationFrame(() => {
        dragFrameRef.current = null
        const idx = draggingIndexRef.current
        if (idx === null) return

        didDragRef.current = true

        const containerX = e.clientX - rect.left
        const containerY = e.clientY - rect.top
        const lngLat = map.unproject([containerX - offsetRef.current.dx, containerY - offsetRef.current.dy])
        const newCoord: Coordinates = [lngLat.lng, lngLat.lat]

        const newCoords = [...coordsRef.current]
        newCoords[idx] = newCoord
        coordsRef.current = newCoords

        const data = getData()
        if (data) {
          if (data.type === 'route') {
            const route = project?.routes.find((r) => r.id === selectedElementId)
            if (route) updateRoute(route.id, { coordinates: newCoords })
          } else if (data.type === 'shape' && data.ringIdx !== undefined) {
            const shape = project?.shapes.find((s) => s.id === selectedElementId)
            if (shape) {
              const newCoordinates = [...shape.coordinates]
              newCoordinates[data.ringIdx] = newCoords
              updateShape(shape.id, { coordinates: newCoordinates as any })
            }
          }
        }

        const point = map.project(newCoord)
        setNodes((prev) =>
          prev.map((n) => (n.index === idx ? { ...n, x: point.x, y: point.y, coord: newCoord } : n))
        )
      })
    }

    const handleWindowMouseUp = () => {
      if (dragFrameRef.current) {
        cancelAnimationFrame(dragFrameRef.current)
        dragFrameRef.current = null
      }
      draggingIndexRef.current = null
      setIsDragging(false)
      setNodes((prev) => [...prev])
    }

    window.addEventListener('mousemove', handleWindowMouseMove)
    window.addEventListener('mouseup', handleWindowMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove)
      window.removeEventListener('mouseup', handleWindowMouseUp)
    }
  }, [isDragging, getData, selectedElementId, project, updateRoute, updateShape])

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    e.preventDefault()
    didDragRef.current = false

    if (e.shiftKey) {
      toggleNodeSelection(index)
      return
    }

    const node = nodes[index]
    if (!node) return
    const map = getMapInstance()
    if (!map) return
    const rect = map.getContainer().getBoundingClientRect()
    const containerX = e.clientX - rect.left
    const containerY = e.clientY - rect.top
    offsetRef.current = { dx: containerX - node.x, dy: containerY - node.y }
    draggingIndexRef.current = index
    setIsDragging(true)
    setNodes((prev) => [...prev])
  }, [nodes, toggleNodeSelection])

  const handleDeleteSelected = useCallback(() => {
    const data = getData()
    if (!data || selectedNodeIndices.length === 0) return
    if (data.coords.length - selectedNodeIndices.length < 2) return

    const newCoords = data.coords.filter((_, i) => !selectedNodeIndices.includes(i))
    if (data.type === 'route') {
      const route = project?.routes.find((r) => r.id === selectedElementId)
      if (route) updateRoute(route.id, { coordinates: newCoords })
    } else if (data.type === 'shape' && data.ringIdx !== undefined) {
      const shape = project?.shapes.find((s) => s.id === selectedElementId)
      if (shape) {
        const newCoordinates = [...shape.coordinates]
        newCoordinates[data.ringIdx] = newCoords
        updateShape(shape.id, { coordinates: newCoordinates as any })
      }
    }
    setSelectedNodeIndices([])
  }, [getData, selectedNodeIndices, project, selectedElementId, updateRoute, updateShape, setSelectedNodeIndices])

  useEffect(() => {
    if (selectedNodeIndices.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        handleDeleteSelected()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeIndices, handleDeleteSelected])

  if (nodes.length === 0 || activeTool !== 'select') return null

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {nodes.map((node) => {
        const isSelected = selectedNodeIndices.includes(node.index)
        return (
          <div
            key={node.index}
            className="absolute pointer-events-auto"
            style={{
              left: node.x,
              top: node.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              onMouseDown={(e) => handleNodeMouseDown(e, node.index)}
              className={`w-3 h-3 rounded-full border-2 shadow-md cursor-grab active:cursor-grabbing transition-all ${
                isSelected
                  ? 'bg-white border-red-500 scale-125 shadow-lg'
                  : draggingIndexRef.current === node.index
                  ? 'bg-blue-400 border-white scale-110'
                  : node.index === 0
                  ? 'bg-emerald-500 border-white hover:bg-emerald-400'
                  : 'bg-blue-500 border-white hover:bg-blue-400'
              }`}
              title={node.index === 0 ? 'Punto inicial' : `Punto ${node.index + 1}`}
            />
          </div>
        )
      })}

      {selectedNodeIndices.length > 0 && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: nodes.find((n) => n.index === selectedNodeIndices[0])?.x ?? 0,
            top: (nodes.find((n) => n.index === selectedNodeIndices[0])?.y ?? 0) - 28,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold shadow-md hover:bg-red-600 transition-colors whitespace-nowrap"
          >
            <span>×</span>
            <span>{selectedNodeIndices.length === 1 ? 'Eliminar' : `Eliminar ${selectedNodeIndices.length}`}</span>
          </button>
        </div>
      )}
    </div>
  )
}
