'use client'

import { useState, useRef, useEffect } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
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
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Refs for Google Maps objects to persist across renders without causing re-renders
  const autocompleteInstanceRef = useRef<google.maps.places.Autocomplete | null>(null)
  const listenersRef = useRef<google.maps.MapsEventListener[]>([])

  const { isLoaded, loadError } = useGoogleMaps()

  const hasLocation = value.lat != null && value.lng != null

  // Sync internal state with prop value
  useEffect(() => {
    setInputValue(value.texto || '')
  }, [value.texto])

  // Initialize Autocomplete manually
  useEffect(() => {
    if (!isLoaded || !inputRef.current || !window.google) return

    // Cleanup previous instance if exists
    if (autocompleteInstanceRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current)
    }

    // Initialize Autocomplete
    // Note: The Widget automatically handles Session Tokens for cost optimization.
    // We do NOT need to create them manually.
    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['geometry', 'formatted_address', 'place_id'],
      types: ['geocode'],
    })

    autocompleteInstanceRef.current = autocomplete

    // Add place_changed listener
    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      
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
      
      // Close dropdown visual helper
      setTimeout(() => {
        const pacContainers = document.querySelectorAll('.pac-container')
        pacContainers.forEach((container) => {
          (container as HTMLElement).style.display = 'none'
        })
      }, 100)
    })

    listenersRef.current.push(listener)

    // Cleanup function
    return () => {
      if (autocompleteInstanceRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteInstanceRef.current)
      }
      // Remove DOM elements created by Google Maps (pac-container)
      const pacContainers = document.querySelectorAll('.pac-container')
      pacContainers.forEach((container) => {
        container.remove()
      })
    }
  }, [isLoaded]) // Only re-run if isLoaded changes

  // Scroll handling to hide dropdown
  useEffect(() => {
    if (!isLoaded) return

    const handleScroll = () => {
      const pacContainers = document.querySelectorAll('.pac-container')
      pacContainers.forEach((container) => {
        (container as HTMLElement).style.display = 'none'
      })
      if (inputRef.current === document.activeElement) {
        inputRef.current?.blur()
      }
    }

    window.addEventListener('scroll', handleScroll, true)
    return () => window.removeEventListener('scroll', handleScroll, true)
  }, [isLoaded])

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

  const handleMapPositionChange = async (lat: number, lng: number) => {
    onChange({ ...value, lat, lng })

    if (window.google && window.google.maps) {
      const geocoder = new google.maps.Geocoder()
      try {
        const response = await geocoder.geocode({
          location: { lat, lng },
          region: 'BR',
        })

        if (response.results && response.results.length > 0) {
          const address = response.results[0].formatted_address
          const placeId = response.results[0].place_id
          
          onChange({
            texto: address,
            lat,
            lng,
            placeId: placeId || null,
          })
          setInputValue(address)
        }
      } catch (error) {
        console.error('Erro ao buscar endereço:', error)
      }
    }
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
        {label && <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100">{label} {required && '*'}</label>}
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border-2 border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">Erro ao carregar Google Maps</p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="space-y-3">
        {label && <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100">{label} {required && '*'}</label>}
        <div className="w-full px-12 py-3 rounded-xl border-2 border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-sm text-slate-600 dark:text-gray-400">Carregando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100">{label} {required && '*'}</label>}

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none z-10">
          <MapPin className="w-5 h-5" />
        </div>

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
