'use client'

import { useLoadScript } from '@react-google-maps/api'

const libraries: ("places")[] = ["places"]

export function useGoogleMaps() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '',
    libraries,
  })

  return { isLoaded, loadError }
}
