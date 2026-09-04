import type { Coordinates } from '@/types/map'

export interface GPXTrack {
  name: string
  description: string
  coordinates: Coordinates[]
  distance: number
  elevation: {
    min: number
    max: number
    gain: number
    loss: number
  }
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface GPXWaypoint {
  name: string
  description: string
  coordinates: Coordinates
  elevation?: number
  type?: string
}

export interface GPXData {
  tracks: GPXTrack[]
  waypoints: GPXWaypoint[]
  name: string
  description: string
}

function parseCoordinateString(coordStr: string): number {
  const num = parseFloat(coordStr)
  return isNaN(num) ? 0 : num
}

function calculateDistance(coords: Coordinates[]): number {
  let total = 0
  for (let i = 1; i < coords.length; i++) {
    const [lon1, lat1] = coords[i - 1]
    const [lon2, lat2] = coords[i]
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    total += R * c
  }
  return total
}

function calculateElevation(elePoints: number[]): { min: number; max: number; gain: number; loss: number } {
  if (elePoints.length === 0) {
    return { min: 0, max: 0, gain: 0, loss: 0 }
  }

  let min = elePoints[0]
  let max = elePoints[0]
  let gain = 0
  let loss = 0

  for (let i = 1; i < elePoints.length; i++) {
    const ele = elePoints[i]
    if (ele < min) min = ele
    if (ele > max) max = ele
    const diff = ele - elePoints[i - 1]
    if (diff > 0) gain += diff
    else loss += Math.abs(diff)
  }

  return { min, max, gain, loss }
}

function calculateBounds(coords: Coordinates[]) {
  let north = -90
  let south = 90
  let east = -180
  let west = 180

  coords.forEach(([lng, lat]) => {
    if (lat > north) north = lat
    if (lat < south) south = lat
    if (lng > east) east = lng
    if (lng < west) west = lng
  })

  return { north, south, east, west }
}

export function parseGPX(gpxString: string): GPXData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(gpxString, 'text/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Error al parsear el archivo GPX')
  }

  const gpxName = doc.querySelector('name')?.textContent || 'Ruta GPX'
  const gpxDesc = doc.querySelector('desc')?.textContent || ''

  const tracks: GPXTrack[] = []
  const waypoints: GPXWaypoint[] = []

  doc.querySelectorAll('trk').forEach((trk) => {
    const name = trk.querySelector('name')?.textContent || 'Sin nombre'
    const desc = trk.querySelector('desc')?.textContent || ''

    trk.querySelectorAll('trkseg').forEach((trkseg) => {
      const coordinates: Coordinates[] = []
      const elevations: number[] = []

      trkseg.querySelectorAll('trkpt').forEach((trkpt) => {
        const lat = parseCoordinateString(trkpt.getAttribute('lat') || '0')
        const lon = parseCoordinateString(trkpt.getAttribute('lon') || '0')
        const ele = trkpt.querySelector('ele')
        const elevation = ele ? parseFloat(ele.textContent || '0') : 0

        coordinates.push([lon, lat])
        elevations.push(elevation)
      })

      if (coordinates.length > 0) {
        tracks.push({
          name,
          description: desc,
          coordinates,
          distance: calculateDistance(coordinates),
          elevation: calculateElevation(elevations),
          bounds: calculateBounds(coordinates),
        })
      }
    })
  })

  doc.querySelectorAll('wpt').forEach((wpt) => {
    const lat = parseCoordinateString(wpt.getAttribute('lat') || '0')
    const lon = parseCoordinateString(wpt.getAttribute('lon') || '0')
    const name = wpt.querySelector('name')?.textContent || 'Waypoint'
    const desc = wpt.querySelector('desc')?.textContent || ''
    const ele = wpt.querySelector('ele')
    const type = wpt.querySelector('type')?.textContent

    waypoints.push({
      name,
      description: desc,
      coordinates: [lon, lat],
      elevation: ele ? parseFloat(ele.textContent || '0') : undefined,
      type,
    })
  })

  return {
    tracks,
    waypoints,
    name: gpxName,
    description: gpxDesc,
  }
}

export async function loadGPXFromUrl(url: string): Promise<GPXData> {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error al descargar el archivo GPX')
  const text = await res.text()
  return parseGPX(text)
}

export async function loadGPXFromFile(file: File): Promise<GPXData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        resolve(parseGPX(text))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsText(file)
  })
}
