import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RoutingService, getProfileOSRM, getProfileLabel } from '@/services/routing'
import type { Coordinates } from '@/types/map'

describe('RoutingService', () => {
  const svc = new RoutingService()
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const geojsonResponse = (coords: number[][], distance: number, duration: number) => ({
    ok: true,
    json: async () => ({
      routes: [{ geometry: { coordinates: coords }, distance, duration }],
    }),
  })

  it('builds an OSRM driving URL and parses the result for car', async () => {
    const start: Coordinates = [-72, -13]
    const end: Coordinates = [-71, -12]
    fetchMock.mockResolvedValue(geojsonResponse([[-72, -13], [-71, -12]], 1234, 567))

    const res = await svc.calculateRoute(start, end, 'car')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('router.project-osrm.org/route/v1/driving/')
    expect(url).toContain('-72,-13;-71,-12')
    expect(res.coordinates).toEqual([[-72, -13], [-71, -12]])
    expect(res.distance).toBe(1234)
    expect(res.duration).toBe(567)
    expect(res.profile).toBe('car')
  })

  it('uses the per-profile server for bike/walk (still /driving path)', async () => {
    fetchMock.mockResolvedValue(geojsonResponse([[0, 0], [1, 1]], 10, 20))
    await svc.calculateRoute([0, 0], [1, 1], 'bike')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('routing.openstreetmap.de/routed-bike/route/v1/driving/')

    fetchMock.mockResolvedValue(geojsonResponse([[0, 0], [1, 1]], 10, 20))
    await svc.calculateRoute([0, 0], [1, 1], 'walk')
    const url2 = fetchMock.mock.calls[1][0] as string
    expect(url2).toContain('routing.openstreetmap.de/routed-foot/route/v1/driving/')
  })

  it('throws when the route service returns no routes', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ routes: [] }) })
    await expect(svc.calculateRoute([0, 0], [1, 1])).rejects.toThrow(/no se encontr/i)
  })

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    await expect(svc.calculateRoute([0, 0], [1, 1])).rejects.toThrow()
  })

  it('calculateWaypointsRoute joins all waypoints with ;', async () => {
    const wps: Coordinates[] = [[0, 0], [1, 1], [2, 2]]
    fetchMock.mockResolvedValue(geojsonResponse([[0, 0], [1, 1], [2, 2]], 99, 99))
    await svc.calculateWaypointsRoute(wps, 'car')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('0,0;1,1;2,2')
  })

  it('helpers expose profile metadata', () => {
    expect(getProfileOSRM('car')).toBe('driving')
    expect(getProfileLabel('walk')).toBe('A pie')
  })
})
