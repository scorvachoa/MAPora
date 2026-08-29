import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GeocodingService } from '@/services/geocoding'

describe('GeocodingService', () => {
  const svc = new GeocodingService()
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('queries Nominatim with the query and Spanish language', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [{ place_id: 1, display_name: 'Cusco, Peru', lat: '-13.5', lon: '-71.9', type: 'city', boundingbox: ['0', '0', '0', '0'] }],
    })
    const res = await svc.search('Cusco')
    const url = fetchMock.mock.calls[0][0] as string
    expect(url).toContain('nominatim.openstreetmap.org/search')
    expect(url).toContain('q=Cusco')
    expect(url).toContain('limit=5')
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Accept-Language']).toBe('es')
    expect(res[0].display_name).toBe('Cusco, Peru')
  })

  it('throws on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) })
    await expect(svc.search('x')).rejects.toThrow()
  })
})
