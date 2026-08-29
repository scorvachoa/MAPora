import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, MapPin, X, Loader2 } from 'lucide-react'
import { useMapActionsStore } from '@/stores/map-actions-store'
import { geocodingService, type GeocodingResult } from '@/services/geocoding'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { triggerAction } = useMapActionsStore()

  const search = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const data = await geocodingService.search(query)
      setResults(data)
      setIsOpen(true)
    } catch (error) {
      console.error('Error searching:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      search()
    }
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleResultClick = (result: GeocodingResult) => {
    const lng = parseFloat(result.lon)
    const lat = parseFloat(result.lat)
    triggerAction({ type: 'flyTo', center: [lng, lat], zoom: 15 })
    setQuery(result.display_name.split(',')[0])
    setResults([])
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="absolute top-4 left-4 z-20"
      style={{ width: 'min(400px, calc(100vw - 200px))' }}
    >
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="pl-4 pr-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Buscar en el mapa"
            className="flex-1 py-3 pr-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={handleClear}
              className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={search}
            className="px-4 py-3 bg-blue-500 hover:bg-blue-600 transition-colors"
          >
            <Search className="h-4 w-4 text-white" />
          </button>
        </div>

        {isOpen && results.length > 0 && (
          <div className="search-dropdown mt-1">
            {results.map((result) => (
              <div
                key={result.place_id}
                className="search-item"
                onClick={() => handleResultClick(result)}
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {result.display_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {result.display_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isOpen && query.length > 2 && results.length === 0 && !isLoading && (
          <div className="search-dropdown mt-1 p-4 text-center">
            <p className="text-sm text-gray-500">No se encontraron resultados</p>
          </div>
        )}
      </div>
    </div>
  )
}
