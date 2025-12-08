'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { Loader2, MapPin, AlertCircle } from 'lucide-react'

interface LocationMapViewerProps {
  address: string | null
  className?: string
}

export default function LocationMapViewer({ address, className = '' }: LocationMapViewerProps) {
  const { isLoaded, loadError } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Default center (Brazil) until address is found
  const defaultCenter = useMemo(() => ({ lat: -14.2350, lng: -51.9253 }), [])

  const mapContainerStyle = {
    width: '100%',
    height: '100%',
  }

  const mapOptions = useMemo<google.maps.MapOptions>(() => ({
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
    fullscreenControl: true,
    gestureHandling: 'greedy',
  }), [])

  // Search logic using PlacesService
  const searchAddress = useCallback((mapInstance: google.maps.Map, query: string) => {
    setLoading(true)
    setError(null)

    const service = new google.maps.places.PlacesService(mapInstance)
    
    const request = {
      query: query,
      fields: ['name', 'geometry'],
    }

    service.findPlaceFromQuery(request, (results, status) => {
      setLoading(false)
      
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0] && results[0].geometry && results[0].geometry.location) {
        const location = results[0].geometry.location
        const newPos = { lat: location.lat(), lng: location.lng() }
        
        setPosition(newPos)
        
        if (results[0].geometry.viewport) {
          mapInstance.fitBounds(results[0].geometry.viewport)
        } else {
          mapInstance.panTo(newPos)
          mapInstance.setZoom(15)
        }
      } else {
        console.error('Places Search failed:', status)
        // Fallback to Geocoder if Places fails (sometimes works better for strict addresses)
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ address: query }, (geoResults, geoStatus) => {
            if (geoStatus === 'OK' && geoResults && geoResults[0]) {
                const loc = geoResults[0].geometry.location
                const pos = { lat: loc.lat(), lng: loc.lng() }
                setPosition(pos)
                mapInstance.panTo(pos)
                mapInstance.setZoom(15)
            } else {
                setError('Localização não encontrada.')
            }
        })
      }
    })
  }, [])

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance)
    if (address) {
      searchAddress(mapInstance, address)
    }
  }, [address, searchAddress])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])
  
  // Clean, retry if address changes while map is already loaded
  useEffect(() => {
    if (map && address) {
        searchAddress(map, address)
    }
  }, [map, address, searchAddress])


  if (loadError) {
    return (
        <div className={`w-full h-full bg-red-50 flex items-center justify-center p-6 ${className}`}>
           <div className="text-center text-red-500">
             <AlertCircle className="w-8 h-8 mx-auto mb-2" />
             <p>Erro ao carregar API do Google Maps.</p>
           </div>
        </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando mapa...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full bg-gray-100 dark:bg-gray-800 relative ${className}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={position || defaultCenter}
        zoom={position ? 15 : 4}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {position && <Marker position={position} animation={google.maps.Animation.DROP} />}
      </GoogleMap>

      {/* Floating Loading State */}
      {loading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10 flex items-center gap-2 border border-slate-200 dark:border-gray-700">
           <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
           <span className="text-sm font-medium text-slate-700 dark:text-gray-200">Localizando...</span>
        </div>
      )}

      {/* Error State Overlay */}
      {error && (
         <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-50 dark:bg-red-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg z-10 flex items-center gap-2 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700 dark:text-red-200">{error}</span>
         </div>
      )}
    </div>
  )
}
