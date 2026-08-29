import { describe, it, expect } from 'vitest'
import { MAP_STYLES, MAP_STYLE_NAMES, getMapStyleSpec } from '@/constants/map-styles'
import type { MapStyle } from '@/types/map'

const STYLES: MapStyle[] = ['standard', 'light', 'dark', 'tourist', 'osm', 'topo']

describe('map-styles constants', () => {
  it('provides a style spec (url or GL style) for every MapStyle', () => {
    for (const s of STYLES) {
      const def = MAP_STYLES[s]
      expect(def).toBeTruthy()
      expect(def.url ?? def.style).toBeTruthy()
    }
  })

  it('provides a human label for every MapStyle', () => {
    for (const s of STYLES) expect(MAP_STYLE_NAMES[s]).toBeTruthy()
  })

  it('every style resolves to a distinct spec', () => {
    const specs = STYLES.map((s) => getMapStyleSpec(s))
    const unique = new Set(specs.map((spec) => (typeof spec === 'string' ? spec : JSON.stringify(spec))))
    expect(unique.size).toBe(STYLES.length)
  })

  it('standard and light resolve to DIFFERENT style URLs', () => {
    expect(getMapStyleSpec('standard')).not.toBe(getMapStyleSpec('light'))
  })

  it('osm and topo are raster styles based on OpenStreetMap tiles', () => {
    const osm = MAP_STYLES.osm.style as any
    const topo = MAP_STYLES.topo.style as any
    expect(osm.sources.raster.type).toBe('raster')
    expect(topo.sources.raster.type).toBe('raster')
    expect(osm.sources.raster.tiles[0]).toContain('openstreetmap.org')
    expect(topo.sources.raster.tiles[0]).toContain('opentopomap.org')
  })
})
