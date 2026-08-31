import type { Coordinates } from '@/types/map'

export type RouteProfile = 'car' | 'bike' | 'walk'

export interface RouteResult {
  coordinates: Coordinates[]
  distance: number
  duration: number
  profile: RouteProfile
}

const PROFILE_LABELS: Record<RouteProfile, string> = {
  car: 'En automóvil',
  bike: 'En bicicleta',
  walk: 'A pie',
}

// OSRM public server only supports driving. For bike/walk we use
// routing.openstreetmap.de which has dedicated servers per profile.
// Note: each server uses the OSRM API format with /driving/ in the path
// because the server itself IS the specialized router.
const PROFILE_SERVERS: Record<RouteProfile, { baseUrl: string; osrmProfile: string }> = {
  car: { baseUrl: 'https://router.project-osrm.org', osrmProfile: 'driving' },
  bike: { baseUrl: 'https://routing.openstreetmap.de/routed-bike', osrmProfile: 'driving' },
  walk: { baseUrl: 'https://routing.openstreetmap.de/routed-foot', osrmProfile: 'driving' },
}

export function getProfileOSRM(profile: RouteProfile): string {
  return PROFILE_SERVERS[profile].osrmProfile
}

export function getProfileLabel(profile: RouteProfile): string {
  return PROFILE_LABELS[profile]
}

const FETCH_TIMEOUT = 15000 // 15 seconds

export class RoutingService {
  async calculateRoute(
    start: Coordinates,
    end: Coordinates,
    profile: RouteProfile = 'car'
  ): Promise<RouteResult> {
    const { baseUrl, osrmProfile } = PROFILE_SERVERS[profile]
    const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`
    const url = `${baseUrl}/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error('Error calculando la ruta')
      const data = await response.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No se encontró una ruta')
      const route = data.routes[0]
      return {
        coordinates: route.geometry.coordinates.map((c: number[]) => [c[0], c[1]] as Coordinates),
        distance: route.distance,
        duration: route.duration,
        profile,
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Tiempo de espera agotado al calcular la ruta')
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }

  async calculateWaypointsRoute(
    waypoints: Coordinates[],
    profile: RouteProfile = 'car'
  ): Promise<RouteResult> {
    if (waypoints.length < 2) throw new Error('Se necesitan al menos 2 puntos')

    const { baseUrl, osrmProfile } = PROFILE_SERVERS[profile]
    const coords = waypoints.map((w) => `${w[0]},${w[1]}`).join(';')
    const url = `${baseUrl}/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    try {
      const response = await fetch(url, { signal: controller.signal })
      if (!response.ok) throw new Error('Error calculando la ruta')
      const data = await response.json()
      if (!data.routes || data.routes.length === 0) throw new Error('No se encontró una ruta')
      const route = data.routes[0]
      return {
        coordinates: route.geometry.coordinates.map((c: number[]) => [c[0], c[1]] as Coordinates),
        distance: route.distance,
        duration: route.duration,
        profile,
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Tiempo de espera agotado al calcular la ruta')
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }
}

export const routingService = new RoutingService()
