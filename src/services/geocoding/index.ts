export interface GeocodingResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  boundingbox: [string, string, string, string]
}

export class GeocodingService {
  private baseUrl: string

  constructor(baseUrl = 'https://nominatim.openstreetmap.org') {
    this.baseUrl = baseUrl
  }

  async search(query: string, limit = 5): Promise<GeocodingResult[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(
        `${this.baseUrl}/search?format=json&q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: { 'Accept-Language': 'es' },
          signal: controller.signal,
        }
      )
      if (!response.ok) throw new Error('Error en la búsqueda')
      return response.json()
    } catch (err: any) {
      if (err?.name === 'AbortError') throw new Error('Tiempo de espera agotado en la búsqueda')
      throw err
    } finally {
      clearTimeout(timeout)
    }
  }
}

export const geocodingService = new GeocodingService()
