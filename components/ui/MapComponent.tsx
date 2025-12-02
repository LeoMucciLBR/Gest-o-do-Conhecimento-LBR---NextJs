'use client'

import { useCallback, useState } from 'react'
import { GoogleMap, Marker } from '@react-google-maps/api'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { Loader2 } from 'lucide-react'

interface MapComponentProps {
  lat: number
  lng: number
  onPositionChange: (lat: number, lng: number) => void
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'on' }],
    },
  ],
}

export default function MapComponent({
  lat,
  lng,
  onPositionChange,
}: MapComponentProps) {
  const { isLoaded } = useGoogleMaps()
  const [markerPosition, setMarkerPosition] = useState({ lat, lng })
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const center = { lat, lng }

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Handle marker drag
  const onMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setMarkerPosition({ lat: newLat, lng: newLng })
        onPositionChange(newLat, newLng)
      }
    },
    [onPositionChange]
  )

  // Handle map click to move marker
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newLat = e.latLng.lat()
        const newLng = e.latLng.lng()
        setMarkerPosition({ lat: newLat, lng: newLng })
        onPositionChange(newLat, newLng)
      }
    },
    [onPositionChange]
  )

  // Update marker position when props change
  useState(() => {
    setMarkerPosition({ lat, lng })
  })

  if (!isLoaded) {
    return (
      <div className="h-[300px] bg-slate-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-sm text-slate-600 dark:text-gray-400">
            Carregando mapa...
          </span>
        </div>
      </div>
    )
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={15}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={onMapClick}
      options={mapOptions}
    >
      <Marker
        position={markerPosition}
        draggable={true}
        onDragEnd={onMarkerDragEnd}
        animation={google.maps.Animation.DROP}
      />
    </GoogleMap>
  )
}
