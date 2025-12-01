'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)
const GeoJSON: any = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
)

// Import Leaflet only on client
let L: any
if (typeof window !== 'undefined') {
  L = require('leaflet')
}

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

export default function ObraMapViewer({ obras, onObraClick, selectedObraId, nonConformities = [], onNonConformityClick }: ObraMapViewerProps) {
  const [mounted, setMounted] = useState(false)
  // Use function initializer to generate unique key per component instance
  const [mapKey] = useState(() => `map-${Date.now()}-${Math.random()}`)

  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined' && !L) {
      L = require('leaflet')
    }

    if (L) {
      // Fix Leaflet icon issue
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      })
    }
  }, [])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'BAIXA': return '#3b82f6' // blue
      case 'MEDIA': return '#eab308' // yellow
      case 'ALTA': return '#f97316' // orange
      case 'CRITICA': return '#ef4444' // red
      default: return '#6b7280' // gray
    }
  }

  const createCustomIcon = (severity: string) => {
    if (!L) return undefined

    const color = getSeverityColor(severity)
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full drop-shadow-md">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="white"></circle>
      </svg>
    `
    
    return L.divIcon({
      className: 'custom-pin-marker',
      html: `<div style="width: 32px; height: 32px;">${svgIcon}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32], // Tip of the pin (bottom center)
      popupAnchor: [0, -32] // Popup above the pin
    })
  }

  if (!mounted) {
    return (
      <div className="w-full h-[600px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-700 dark:text-gray-300">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Carregando mapa...</span>
        </div>
      </div>
    )
  }

  // Filter obras with valid geometries
  const obrasWithGeometry = obras.filter((obra) => obra.geometria)

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

  // Calculate center point from all geometries
  const calculateCenter = (): [number, number] => {
    // Default center (Brazil)
    let centerLat = -15.7975
    let centerLng = -47.8919

    // Try to get center from first obra geometry
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

    return [centerLat, centerLng]
  }

  const center = calculateCenter()

  const getFeatureStyle = (obraId: number) => {
    const isSelected = obraId === selectedObraId
    return {
      color: isSelected ? '#ef4444' : '#3b82f6',
      weight: isSelected ? 5 : 3,
      opacity: isSelected ? 1 : 0.7,
      lineJoin: 'round' as const,
      lineCap: 'round' as const,
    }
  }

  return (
    <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-200 dark:border-gray-700">
      <MapContainer
        key={mapKey}
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {obrasWithGeometry.map((obra) => (
          <GeoJSON
            key={`obra-${obra.id}`}
            data={obra.geometria}
            style={getFeatureStyle(obra.id)}
            eventHandlers={{
              click: (e) => {
                if (onObraClick) {
                  const { lat, lng } = e.latlng
                  onObraClick(obra, { lat, lng })
                }
              },
              mouseover: (e) => {
                const layer = e.target
                layer.setStyle({
                  weight: 6,
                  color: selectedObraId === obra.id ? '#ef4444' : '#2563eb',
                  opacity: 1,
                })
              },
              mouseout: (e) => {
                const layer = e.target
                layer.setStyle(getFeatureStyle(obra.id))
              },
            }}
          />
        ))}

        {L && nonConformities.map((nc) => (
          <Marker
            key={nc.id}
            position={[nc.lat, nc.lng]}
            icon={createCustomIcon(nc.severity)}
            eventHandlers={{
              click: (e) => {
                console.log('Marker clicked:', nc)
                if (e.originalEvent) {
                  L.DomEvent.stopPropagation(e.originalEvent)
                }
                if (onNonConformityClick) {
                  console.log('Calling onNonConformityClick')
                  onNonConformityClick(nc)
                }
              }
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
