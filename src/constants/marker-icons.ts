export interface MarkerIcon {
  id: string
  name: string
  svg: string
  color: string
}

export const MARKER_ICONS: MarkerIcon[] = [
  {
    id: 'pin',
    name: 'Pin',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
    color: '#ea4335',
  },
  {
    id: 'flag',
    name: 'Bandera',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>`,
    color: '#ea4335',
  },
  {
    id: 'mountain',
    name: 'Montaña',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z"/></svg>`,
    color: '#34a853',
  },
  {
    id: 'star',
    name: 'Estrella',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    color: '#fbbc04',
  },
  {
    id: 'camera',
    name: 'Fotografía',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12m-3.2 0a3.2 3.2 0 1 0 6.4 0a3.2 3.2 0 1 0-6.4 0M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9z"/></svg>`,
    color: '#4285f4',
  },
  {
    id: 'hotel',
    name: 'Hotel',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>`,
    color: '#4285f4',
  },
  {
    id: 'restaurant',
    name: 'Restaurante',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z"/></svg>`,
    color: '#ea4335',
  },
  {
    id: 'camping',
    name: 'Campamento',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h2L12 2 5.05 12H7l-3.9 6h2.1l1.8-3h8.01l1.8 3H21L17 12zm-5-5.99L14.53 9h-5.06L12 6.01zM8.45 14l1.55-3h4l1.55 3h-7.1z"/></svg>`,
    color: '#34a853',
  },
  {
    id: 'transport',
    name: 'Transporte',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>`,
    color: '#5f6368',
  },
  {
    id: 'water',
    name: 'Agua',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/></svg>`,
    color: '#4285f4',
  },
  {
    id: 'viewpoint',
    name: 'Mirador',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
    color: '#fbbc04',
  },
  {
    id: 'ruins',
    name: 'Ruinas',
    svg: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 20h20v2H2v-2zm2-3h2v2H4v-2zm4-3h2v2H8v-2zm-4 0h2v2H4v-2zm-4 3h2v2H0v-2zm8 0h2v2H8v-2zm8-10v12h2V7h-2zm-4 8h2v2h-2v-2zm4 0h2v2h-2v-2zm4-5h2v7h2V7h-2zm-4 5h2v2h-2v-2zm0-3h2v2h-2V7zm-4 3h2v2H8v-2z"/></svg>`,
    color: '#a142f4',
  },
]

export const MARKER_COLORS = [
  '#ea4335',
  '#4285f4',
  '#34a853',
  '#fbbc04',
  '#ff6d01',
  '#a142f4',
  '#e91e63',
  '#00897b',
  '#5f6368',
  '#185abc',
]

export function getMarkerSvgById(id: string): string | undefined {
  return MARKER_ICONS.find((icon) => icon.id === id)?.svg
}

export function getMarkerColorById(id: string): string | undefined {
  return MARKER_ICONS.find((icon) => icon.id === id)?.color
}
