'use client'

import { useEffect, useState, useCallback } from 'react'
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'
import { useGoogleMaps } from '@/hooks/useGoogleMaps'
import { Loader2 } from 'lucide-react'

export type ObraWithGeometry = {
  id: number
  nome: string | null
  km_inicio: number
  km_fim: number
  uf: string
  geometria: any
}

export type NonConformityMarker = {
  id: string
  lat: number
  lng: number
  severity: string
  description: string
  km: number
}

interface ObraMapViewerProps {
  obras: ObraWithGeometry[]
  onObraClick?: (obra: ObraWithGeometry, coords?: { lat: number; lng: number }) => void
  selectedObraId?: number | null
  nonConformities?: NonConformityMarker[]
  onNonConformityClick?: (nc: NonConformityMarker) => void
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
}

export default function ObraMapViewer({ 
  obras, 
  onObraClick, 
  selectedObraId, 
  nonConformities = [], 
  onNonConformityClick 
}: ObraMapViewerProps) {
  const { isLoaded } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'BAIXA': return '#3b82f6' // blue
      case 'MEDIA': return '#eab308' // yellow
      case 'ALTA': return '#f97316' // orange
      case 'CRITICA': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  const createCustomMarkerIcon = (severity: string): google.maps.Icon => {
    const color = getSeverityColor(severity)
    
    // Create SVG marker
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white"></circle>
      </svg>
    `
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 32),
      anchor: new google.maps.Point(16, 32),
    }
  }

  // Filter obras with valid geometries
  const obrasWithGeometry = obras.filter((obra) => obra.geometria)

  // Calculate center point from all geometries
  const calculateCenter = (): { lat: number; lng: number } => {
    let centerLat = -15.7975
    let centerLng = -47.8919

    if (obrasWithGeometry[0]?.geometria) {
      try {
        const geom = obrasWithGeometry[0].geometria
        if (geom.type === 'LineString' && geom.coordinates?.length > 0) {
          const midPoint = Math.floor(geom.coordinates.length / 2)
          const [lng, lat] = geom.coordinates[midPoint]
          centerLat = lat
          centerLng = lng
        }
      } catch (e) {
        console.error('Error calculating center:', e)
      }
    }

    return { lat: centerLat, lng: centerLng }
  }

  const center = calculateCenter()

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
    
    // Fit bounds to show all geometries
    if (obrasWithGeometry.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      
      obrasWithGeometry.forEach((obra) => {
        if (obra.geometria?.type === 'LineString') {
          obra.geometria.coordinates.forEach(([lng, lat]: [number, number]) => {
            bounds.extend({ lat, lng })
          })
        }
      })
      
      map.fitBounds(bounds)
    }
  }, [obrasWithGeometry])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  if (!isLoaded) {
    return (
      <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando mapa...</span>
        </div>
      </div>
    )
  }

  if (obrasWithGeometry.length === 0) {
    return (
      <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="text-slate-700 dark:text-gray-300 font-medium">
            Nenhuma obra com geometria disponível para exibir no mapa.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-gray-700">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {/* Render road geometries as Polylines */}
        {obrasWithGeometry.map((obra) => {
          if (!obra.geometria || obra.geometria.type !== 'LineString') return null

          const isSelected = obra.id === selectedObraId
          
          // Convert GeoJSON coordinates [lng, lat] to Google Maps format {lat, lng}
          const path = obra.geometria.coordinates.map(([lng, lat]: [number, number]) => ({
            lat,
            lng,
          }))

          return (
            <Polyline
              key={`obra-${obra.id}`}
              path={path}
              options={{
                strokeColor: isSelected ? '#ef4444' : '#3b82f6',
                strokeOpacity: isSelected ? 1.0 : 0.7,
                strokeWeight: isSelected ? 5 : 3,
                clickable: true,
              }}
              onClick={(e) => {
                if (onObraClick && e.latLng) {
                  onObraClick(obra, {
                    lat: e.latLng.lat(),
                    lng: e.latLng.lng(),
                  })
                }
              }}
              onMouseOver={(e) => {
                // Highlight on hover
                const polyline = e as any
                if (polyline.setOptions) {
                  polyline.setOptions({
                    strokeWeight: 6,
                    strokeColor: isSelected ? '#ef4444' : '#2563eb',
                    strokeOpacity: 1.0,
                  })
                }
              }}
              onMouseOut={(e) => {
                // Reset style
                const polyline = e as any
                if (polyline.setOptions) {
                  polyline.setOptions({
                    strokeColor: isSelected ? '#ef4444' : '#3b82f6',
                    strokeWeight: isSelected ? 5 : 3,
                    strokeOpacity: isSelected ? 1.0 : 0.7,
                  })
                }
              }}
            />
          )
        })}

        {/* Render non-conformity markers */}
        {nonConformities.map((nc) => (
          <Marker
            key={nc.id}
            position={{ lat: nc.lat, lng: nc.lng }}
            icon={createCustomMarkerIcon(nc.severity)}
            onClick={() => {
              if (onNonConformityClick) {
                onNonConformityClick(nc)
              }
            }}
            title={`${nc.severity}: ${nc.description} (KM ${nc.km})`}
          />
        ))}
      </GoogleMap>
    </div>
  )
}
