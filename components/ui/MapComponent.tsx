'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface MarkerDraggableProps {
  lat: number
  lng: number
  onChangePosition: (lat: number, lng: number) => void
}

function MarkerDraggable({ lat, lng, onChangePosition }: MarkerDraggableProps) {
  const [position, setPosition] = useState<L.LatLngExpression>([lat, lng])

  useMapEvents({
    click(e) {
      setPosition(e.latlng)
      onChangePosition(e.latlng.lat, e.latlng.lng)
    },
  })

  return (
    <Marker
      draggable
      position={position}
      icon={markerIcon}
      eventHandlers={{
        dragend(e) {
          const marker = e.target as L.Marker
          const pos = marker.getLatLng()
          setPosition(pos)
          onChangePosition(pos.lat, pos.lng)
        },
      }}
    />
  )
}

function FitBounds({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lng], 14)
  }, [map, lat, lng])

  return null
}

interface MapComponentProps {
  lat: number
  lng: number
  onPositionChange: (lat: number, lng: number) => void
}

export default function MapComponent({
  lat,
  lng,
  onPositionChange,
}: MapComponentProps) {
  const center: [number, number] = [lat, lng]

  return (
    <MapContainer
      center={center}
      zoom={14}
      style={{ height: '300px', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds lat={lat} lng={lng} />
      <MarkerDraggable lat={lat} lng={lng} onChangePosition={onPositionChange} />
    </MapContainer>
  )
}
