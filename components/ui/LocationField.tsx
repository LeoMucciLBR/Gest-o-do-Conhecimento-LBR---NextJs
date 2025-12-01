'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dinamically import map to avoid SSR issues
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-72 bg-slate-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  ),
})

export type LocationValue = {
  texto: string
  lat: number | null
  lng: number | null
  placeId: string | null
}

interface LocationFieldProps {
  value: LocationValue
  onChange: (value: LocationValue) => void
  placeholder?: string
  label?: string
  required?: boolean
}

type Suggestion = {
  id: string
  label: string
  lat: number
  lng: number
}

export function LocationField({
  value,
  onChange,
  placeholder = 'Digite o endereço ou localização',
  label,
  required = false,
}: LocationFieldProps) {
  const [query, setQuery] = useState(value.texto || '')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  const hasLocation = value.lat != null && value.lng != null

  useEffect(() => {
    setQuery(value.texto || '')
  }, [value.texto])

  // Fetch suggestions from Nominatim (OpenStreetMap)
  const fetchSuggestions = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        trimmed
      )}&limit=5&addressdetails=1`
      
      const resp = await fetch(url, {
        headers: { Accept: 'application/json' },
      })

      if (!resp.ok) throw new Error('Falha ao buscar sugestões')

      const data = await resp.json()
      const items: Suggestion[] = data.map((item: any) => ({
        id: item.place_id,
        label: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }))

      setSuggestions(items)
      setIsOpen(items.length > 0)
    } catch (error) {
      console.error('Erro no autocomplete:', error)
      setSuggestions([])
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newQuery)
    }, 400)
  }

  const handleSelect = (suggestion: Suggestion) => {
    onChange({
      texto: suggestion.label,
      lat: suggestion.lat,
      lng: suggestion.lng,
      placeId: suggestion.id,
    })
    setQuery(suggestion.label)
    setIsOpen(false)
    setSuggestions([])
  }

  const handleMapPositionChange = (lat: number, lng: number) => {
    onChange({
      ...value,
      lat,
      lng,
    })
  }

  const handleClear = () => {
    onChange({
      texto: '',
      lat: null,
      lng: null,
      placeId: null,
    })
    setQuery('')
    setSuggestions([])
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100">
          {label} {required && '*'}
        </label>
      )}

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none z-10">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <MapPin className="w-5 h-5" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleQueryChange}
          onFocus={() => {
            setFocused(true)
            if (suggestions.length > 0) setIsOpen(true)
          }}
          onBlur={() => {
            setFocused(false)
            setTimeout(() => setIsOpen(false), 200)
          }}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
            focused
              ? 'border-blue-500 focus:ring-blue-500'
              : 'border-slate-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
          }`}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Limpar localização"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Suggestions dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg max-h-64 overflow-auto animate-in fade-in slide-in-from-top-2 duration-200">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-800 dark:text-gray-200 transition-colors border-b border-slate-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{s.label}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      {hasLocation && (
        <div className="mt-4 rounded-xl border-2 border-slate-200 dark:border-gray-700 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          <MapComponent
            lat={value.lat!}
            lng={value.lng!}
            onPositionChange={handleMapPositionChange}
          />
          <div className="bg-slate-50 dark:bg-gray-800 px-4 py-3 border-t-2 border-slate-200 dark:border-gray-700">
            <p className="text-xs text-slate-600 dark:text-gray-400 flex items-center gap-2">
              <MapPin className="w-3 h-3" />
              Arraste o marcador ou clique no mapa para ajustar a localização
            </p>
          </div>
        </div>
      )}

      {value.texto && !hasLocation && (
        <p className="text-xs text-slate-500 dark:text-gray-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {value.texto}
        </p>
      )}
    </div>
  )
}

export default LocationField
