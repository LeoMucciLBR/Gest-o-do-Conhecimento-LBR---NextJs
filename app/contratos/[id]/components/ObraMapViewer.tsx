'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  hoveredObraId?: number | null
  nonConformities?: NonConformityMarker[]
  onNonConformityClick?: (nc: NonConformityMarker) => void
  height?: string
  className?: string
}

export default function ObraMapViewer({ 
  obras, 
  onObraClick, 
  selectedObraId,
  hoveredObraId,
  nonConformities = [], 
  onNonConformityClick,
  height = '600px',
  className = ''
}: ObraMapViewerProps) {
  const { isLoaded } = useGoogleMaps()
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [initialBounds, setInitialBounds] = useState<google.maps.LatLngBounds | null>(null)

  const mapContainerStyle = {
    width: '100%',
    height: height,
  }

  const mapOptions = useMemo<google.maps.MapOptions>(() => {
    if (!isLoaded || typeof google === 'undefined') {
      return {
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
        gestureHandling: 'greedy',
      }
    }
    
    return {
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: true,
      mapTypeControl: true,
      fullscreenControl: true,
      gestureHandling: 'greedy',
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
      },
      styles: [
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ visibility: "simplified" }]
        }
      ]
    }
  }, [isLoaded])

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

  // Helper function to add geometry coordinates to bounds
  const addGeometryToBounds = (geometry: any, bounds: google.maps.LatLngBounds) => {
    if (!geometry || !geometry.type) return

    if (geometry.type === 'LineString' && geometry.coordinates) {
      geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
        bounds.extend({ lat, lng })
      })
    } else if (geometry.type === 'MultiLineString' && geometry.coordinates) {
      geometry.coordinates.forEach((line: [number, number][]) => {
        line.forEach(([lng, lat]) => {
          bounds.extend({ lat, lng })
        })
      })
    } else if (geometry.type === 'GeometryCollection' && geometry.geometries) {
      geometry.geometries.forEach((geom: any) => {
        addGeometryToBounds(geom, bounds)
      })
    }
  }

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
      let hasPoints = false
      
      obrasWithGeometry.forEach((obra) => {
        const geom = obra.geometria
        
        // Handle FeatureCollection (from PostGIS ST_AsGeoJSON)
        if (geom?.type === 'FeatureCollection' && geom.features) {
          geom.features.forEach((feature: any) => {
            if (feature.geometry) {
              addGeometryToBounds(feature.geometry, bounds)
              hasPoints = true
            }
          })
        }
        // Handle Feature
        else if (geom?.type === 'Feature' && geom.geometry) {
          addGeometryToBounds(geom.geometry, bounds)
          hasPoints = true
        }
        // Handle direct geometry
        else if (geom) {
          addGeometryToBounds(geom, bounds)
          hasPoints = true
        }
      })
      
      if (hasPoints) {
        map.fitBounds(bounds)
        // Store the initial bounds to restore later
        setInitialBounds(bounds)
      }
    }
  }, [obrasWithGeometry])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Auto-zoom to hovered or selected obra
  useEffect(() => {
    if (!map) return

    // Priority: Hovered > Selected > All
    const targetId = hoveredObraId || selectedObraId

    if (!targetId) {
      if (initialBounds) {
        // Smooth transition back to showing all obras
        map.fitBounds(initialBounds)
      }
      return
    }

    // If an obra is hovered or selected, zoom to it with smooth animation
    const targetObra = obrasWithGeometry.find(o => o.id === targetId)
    if (!targetObra || !targetObra.geometria) return

    const bounds = new google.maps.LatLngBounds()
    addGeometryToBounds(targetObra.geometria, bounds)
    
    // Add padding for better visual appearance
    const padding = { top: 50, right: 50, bottom: 50, left: 50 }
    
    // Smooth pan and zoom to the target obra
    map.fitBounds(bounds, padding)
    
    // Optionally adjust zoom to not be too close with smooth animation
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const currentZoom = map.getZoom()
      if (currentZoom && currentZoom > 16) {
        map.setZoom(16)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [hoveredObraId, selectedObraId, map, obrasWithGeometry, initialBounds])


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
    <div className={`w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-gray-700 ${className}`}>
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
          if (!obra.geometria) return null
          
          // Support both LineString and MultiLineString
          const isLineString = obra.geometria.type === 'LineString'
          const isMultiLineString = obra.geometria.type === 'MultiLineString'
          
          if (!isLineString && !isMultiLineString) return null

          const isSelected = obra.id === selectedObraId
          const isHovered = obra.id === hoveredObraId
          
          // Convert GeoJSON coordinates [lng, lat] to Google Maps format {lat, lng}
          let path: { lat: number; lng: number }[] = []
          
          if (isLineString) {
            path = obra.geometria.coordinates.map(([lng, lat]: [number, number]) => ({
              lat,
              lng,
            }))
          } else if (isMultiLineString) {
            // MultiLineString: flatten all line segments into single path
            path = obra.geometria.coordinates.flatMap((line: [number, number][]) =>
              line.map(([lng, lat]) => ({ lat, lng }))
            )
          }

          // Determine colors and styles with smooth transitions
          const baseColor = '#3b82f6' // blue
          const hoverColor = '#f97316' // orange
          const selectedColor = '#ef4444' // red
          
          const currentColor = isSelected ? selectedColor : isHovered ? hoverColor : baseColor
          const currentWeight = isSelected ? 6 : isHovered ? 5 : 3
          const currentOpacity = (isSelected || isHovered) ? 1.0 : 0.7

          return (
            <Polyline
              key={`obra-${obra.id}`}
              path={path}
              options={{
                strokeColor: currentColor,
                strokeOpacity: currentOpacity,
                strokeWeight: currentWeight,
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
                // Smooth highlight on direct mouse hover
                const polyline = e as any
                if (polyline.setOptions && !isSelected && !isHovered) {
                  polyline.setOptions({
                    strokeWeight: 7,
                    strokeColor: '#2563eb',
                    strokeOpacity: 1.0,
                  })
                }
              }}
              onMouseOut={(e) => {
                // Reset to base style only if not hovered from table
                const polyline = e as any
                if (polyline.setOptions && !isSelected && !isHovered) {
                  polyline.setOptions({
                    strokeColor: baseColor,
                    strokeWeight: 3,
                    strokeOpacity: 0.7,
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
