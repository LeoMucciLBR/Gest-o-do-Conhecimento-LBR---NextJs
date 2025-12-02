'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
import { Autocomplete } from '@react-google-maps/api'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import MapComponent from './MapComponent'

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

export function LocationField({
  value,
  onChange,
  placeholder = 'Digite o endereço, cidade ou CEP',
  label,
  required = false,
}: LocationFieldProps) {
  const [inputValue, setInputValue] = useState(value.texto || '')
  const [focused, setFocused] = useState(false)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { isLoaded, loadError } = useGoogleMaps()

  const hasLocation = value.lat != null && value.lng != null

  useEffect(() => {
    setInputValue(value.texto || '')
  }, [value.texto])

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete
    
    autocomplete.setOptions({
      componentRestrictions: { country: 'br' },
      fields: ['geometry', 'formatted_address', 'place_id'],
      types: ['geocode'],
    })
  }

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return
    
    const place = autocompleteRef.current.getPlace()
    
    if (!place || !place.geometry || !place.geometry.location) {
      return
    }
    
    const newValue = {
      texto: place.formatted_address || '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      placeId: place.place_id || null,
    }
    
    onChange(newValue)
    setInputValue(newValue.texto)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (!newValue) {
      onChange({
        texto: '',
        lat: null,
        lng: null,
        placeId: null,
      })
    }
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
    setInputValue('')
    inputRef.current?.focus()
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        {label && (
          <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100">
            {label} {required && '*'}
          </label>
        )}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">
            Erro ao carregar Google Maps
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {label && (
          <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100">
            {label} {required && '*'}
          </label>
        )}
        <div className="w-full px-12 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-slate-600 dark:text-gray-400">
              Carregando...
            </span>
          </div>
        </div>
      </div>
    )
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
          <MapPin className="w-5 h-5" />
        </div>

        <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            required={required}
            className={`w-full pl-12 pr-12 py-3 rounded-xl border-2 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
              focused
                ? 'border-blue-500 focus:ring-blue-500'
                : 'border-slate-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          />
        </Autocomplete>

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Limpar localização"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {hasLocation && (
        <div className="mt-4 rounded-xl border-2 border-slate-200 dark:border-gray-700 overflow-hidden shadow-lg">
          <MapComponent
            lat={value.lat!}
            lng={value.lng!}
            onPositionChange={handleMapPositionChange}
          />
        </div>
      )}
    </div>
  )
}

export default LocationField
