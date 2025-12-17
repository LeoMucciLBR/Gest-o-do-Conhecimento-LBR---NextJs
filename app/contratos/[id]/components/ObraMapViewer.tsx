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
  hoveredObraIds?: Set<number> | null  // Support multiple hovered IDs
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
  hoveredObraIds,  // New prop for multiple IDs
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

  // Create custom icon for obras (pontos fixos)
  const createObraPointIcon = (isSelected: boolean, isHovered: boolean): google.maps.Icon => {
    const color = isSelected ? '#ef4444' : isHovered ? '#f97316' : '#22c55e' // green for obras
    const size = isSelected ? 40 : isHovered ? 36 : 32
    
    // Create building/construction icon SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
        <path d="M3 21h18"/>
        <path d="M5 21V7l8-4v18"/>
        <path d="M19 21V11l-6-4"/>
        <path d="M9 9h1"/>
        <path d="M9 13h1"/>
        <path d="M9 17h1"/>
      </svg>
    `
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size/2, size),
    }
  }

  // Filter obras with valid geometries
  const obrasWithGeometry = obras.filter((obra) => obra.geometria)

  // Helper function to add geometry coordinates to bounds
  const addGeometryToBounds = (geometry: any, bounds: google.maps.LatLngBounds) => {
    if (!geometry || !geometry.type) return

    // Handle Feature wrapper
    if (geometry.type === 'Feature' && geometry.geometry) {
      addGeometryToBounds(geometry.geometry, bounds)
      return
    }

    // Handle FeatureCollection wrapper
    if (geometry.type === 'FeatureCollection' && geometry.features) {
      geometry.features.forEach((feature: any) => {
        addGeometryToBounds(feature, bounds)
      })
      return
    }

    // Handle Point geometry
    if (geometry.type === 'Point' && geometry.coordinates) {
      const [lng, lat] = geometry.coordinates
      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
        bounds.extend({ lat, lng })
      }
    } else if (geometry.type === 'LineString' && geometry.coordinates) {
      geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          bounds.extend({ lat, lng })
        }
      })
    } else if (geometry.type === 'MultiLineString' && geometry.coordinates) {
      geometry.coordinates.forEach((line: [number, number][]) => {
        (line || []).forEach(([lng, lat]) => {
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            bounds.extend({ lat, lng })
          }
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
        
        // Check if bounds are too small (single point or very close points)
        // In this case, set a reasonable zoom level
        const ne = bounds.getNorthEast()
        const sw = bounds.getSouthWest()
        const latDiff = Math.abs(ne.lat() - sw.lat())
        const lngDiff = Math.abs(ne.lng() - sw.lng())
        
        // If the bounds are very small (single point or close points), set a better zoom
        if (latDiff < 0.001 && lngDiff < 0.001) {
          // Single point - set zoom to street level (15-16)
          setTimeout(() => {
            map.setZoom(15)
          }, 100)
        } else if (latDiff < 0.01 && lngDiff < 0.01) {
          // Very small area - set zoom to neighborhood level
          setTimeout(() => {
            map.setZoom(14)
          }, 100)
        }
        
        // Store the initial bounds to restore later
        setInitialBounds(bounds)
      }
    }
  }, [obrasWithGeometry])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Convert hoveredObraIds Set to a stable string for dependency comparison
  const hoveredIdsKey = hoveredObraIds ? Array.from(hoveredObraIds).sort().join(',') : ''

  // Auto-zoom to hovered or selected obra
  useEffect(() => {
    if (!map) return

    // Priority: hoveredObraId > hoveredObraIds (Set) > selectedObraId > All
    let targetIds: number[] = []
    
    if (hoveredObraId) {
      targetIds = [hoveredObraId]
    } else if (hoveredObraIds && hoveredObraIds.size > 0) {
      targetIds = Array.from(hoveredObraIds)
    } else if (selectedObraId) {
      targetIds = [selectedObraId]
    }

    if (targetIds.length === 0) {
      if (initialBounds) {
        // Smooth transition back to showing all obras
        map.fitBounds(initialBounds)
      }
      return
    }

    // Find all target obras
    const targetObras = obrasWithGeometry.filter(o => targetIds.includes(o.id))
    if (targetObras.length === 0) return

    // Build bounds from all target obras
    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false
    
    targetObras.forEach(obra => {
      if (obra.geometria) {
        addGeometryToBounds(obra.geometria, bounds)
        hasPoints = true
      }
    })
    
    if (!hasPoints) return
    
    // Check if it's a point geometry (single point or very small bounds)
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const latDiff = Math.abs(ne.lat() - sw.lat())
    const lngDiff = Math.abs(ne.lng() - sw.lng())
    const isPointGeometry = latDiff < 0.001 && lngDiff < 0.001
    
    // Add padding for better visual appearance
    const padding = { top: 50, right: 50, bottom: 50, left: 50 }
    
    // Smooth pan and zoom to the target obra
    map.fitBounds(bounds, padding)
    
    // Adjust zoom based on geometry type
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const currentZoom = map.getZoom()
      
      if (isPointGeometry) {
        // For point geometries, set zoom to street level (15)
        map.setZoom(15)
      } else if (currentZoom && currentZoom > 16) {
        // For line geometries, cap zoom at 16
        map.setZoom(16)
      }
    })

    return () => {
      google.maps.event.removeListener(listener)
    }
  }, [hoveredObraId, hoveredIdsKey, selectedObraId, map, obrasWithGeometry, initialBounds])


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
          
          // Helper function to extract the actual geometry from various GeoJSON formats
          const extractGeometry = (geom: any): any => {
            if (!geom) return null
            
            // If no type, check if it's already coordinates array
            if (!geom.type) {
              console.warn(`Obra ${obra.id}: Geometry has no type property`)
              return null
            }
            
            // If it's already LineString, MultiLineString, or Point return as-is
            if (geom.type === 'LineString' || geom.type === 'MultiLineString' || geom.type === 'Point') {
              return geom
            }
            
            // If it's a FeatureCollection, get the first feature's geometry
            if (geom.type === 'FeatureCollection' && geom.features?.length > 0) {
              return extractGeometry(geom.features[0])
            }
            
            // If it's a Feature, get its geometry
            if (geom.type === 'Feature' && geom.geometry) {
              return extractGeometry(geom.geometry)
            }
            
            // If it's a GeometryCollection, get the first geometry
            if (geom.type === 'GeometryCollection' && geom.geometries?.length > 0) {
              return extractGeometry(geom.geometries[0])
            }
            
            // Unsupported type
            console.warn(`Obra ${obra.id}: Unsupported geometry type '${geom.type}'`)
            return null
          }
          
          const geometry = extractGeometry(obra.geometria)
          if (!geometry) {
            return null
          }
          
          // Support LineString, MultiLineString and Point
          const isLineString = geometry.type === 'LineString'
          const isMultiLineString = geometry.type === 'MultiLineString'
          const isPoint = geometry.type === 'Point'
          
          // Handle Point geometry (ponto fixo) - render as Marker
          if (isPoint && geometry.coordinates) {
            const [lng, lat] = geometry.coordinates
            if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
              return null
            }
            
            const isSelected = obra.id === selectedObraId
            const isHovered = obra.id === hoveredObraId || (hoveredObraIds?.has(obra.id) ?? false)
            
            return (
              <Marker
                key={`obra-point-${obra.id}`}
                position={{ lat, lng }}
                icon={createObraPointIcon(isSelected, isHovered)}
                onClick={() => {
                  if (onObraClick) {
                    onObraClick(obra, { lat, lng })
                  }
                }}
                title={`${obra.nome} (KM ${obra.km_inicio})`}
              />
            )
          }
          
          if (!isLineString && !isMultiLineString) return null

          const isSelected = obra.id === selectedObraId
          // Check both single ID and multiple IDs Set
          const isHovered = obra.id === hoveredObraId || (hoveredObraIds?.has(obra.id) ?? false)
          
          // Convert GeoJSON coordinates [lng, lat] to Google Maps format {lat, lng}
          let path: { lat: number; lng: number }[] = []
          
          try {
            if (isLineString && geometry.coordinates?.length > 0) {
              path = geometry.coordinates
                .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
                .map(([lng, lat]: [number, number]) => ({
                  lat: Number(lat),
                  lng: Number(lng),
                }))
                .filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng))
            } else if (isMultiLineString && geometry.coordinates?.length > 0) {
              // MultiLineString: flatten all line segments into single path
              path = geometry.coordinates.flatMap((line: [number, number][]) =>
                (line || [])
                  .filter((coord: any) => Array.isArray(coord) && coord.length >= 2)
                  .map(([lng, lat]: [number, number]) => ({ 
                    lat: Number(lat), 
                    lng: Number(lng) 
                  }))
              ).filter((p: any) => !isNaN(p.lat) && !isNaN(p.lng))
            }
          } catch (err) {
            console.error(`Obra ${obra.id}: Error parsing coordinates:`, err)
            return null
          }
          
          // Skip if no valid path coordinates
          if (!path || path.length < 2) {
            console.warn(`Obra ${obra.id}: Not enough valid coordinates (${path?.length || 0})`)
            return null
          }
          
          // Final validation - ensure all points have valid lat/lng
          const validPath = path.filter(p => 
            p && 
            typeof p.lat === 'number' && 
            typeof p.lng === 'number' && 
            !isNaN(p.lat) && 
            !isNaN(p.lng) &&
            p.lat >= -90 && p.lat <= 90 &&
            p.lng >= -180 && p.lng <= 180
          )
          
          if (validPath.length < 2) {
            console.warn(`Obra ${obra.id}: Path validation failed (${path.length} -> ${validPath.length} valid points)`)
            return null
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
              path={validPath}
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
