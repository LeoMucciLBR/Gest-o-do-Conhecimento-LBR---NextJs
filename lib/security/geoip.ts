/**
 * GeoIP - Serviço de geolocalização de IP
 * Usa ip-api.com (grátis, 45 req/min)
 */

interface GeoLocation {
  country: string
  countryCode: string
  region: string
  city: string
  lat: number
  lon: number
  isp: string
  status: 'success' | 'fail'
}

const IPAPI_URL = 'http://ip-api.com/json/'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

// Cache simples em memória
const cache = new Map<string, { data: GeoLocation; expires: number }>()

/**
 * Busca país do IP
 */
export async function getCountryFromIp(ipAddress: string): Promise<string> {
  const location = await getLocationFromIp(ipAddress)
  return location.country
}

/**
 * Verifica se IP é local ou privado
 */
function isPrivateOrLocalIp(ipAddress: string): boolean {
  return (
    ipAddress === '127.0.0.1' ||
    ipAddress === 'localhost' ||
    ipAddress === '::1' ||
    ipAddress.startsWith('192.168.') ||
    ipAddress.startsWith('10.') ||
    ipAddress.startsWith('172.16.') ||
    ipAddress.startsWith('172.17.') ||
    ipAddress.startsWith('172.18.') ||
    ipAddress.startsWith('172.19.') ||
    ipAddress.startsWith('172.20.') ||
    ipAddress.startsWith('172.21.') ||
    ipAddress.startsWith('172.22.') ||
    ipAddress.startsWith('172.23.') ||
    ipAddress.startsWith('172.24.') ||
    ipAddress.startsWith('172.25.') ||
    ipAddress.startsWith('172.26.') ||
    ipAddress.startsWith('172.27.') ||
    ipAddress.startsWith('172.28.') ||
    ipAddress.startsWith('172.29.') ||
    ipAddress.startsWith('172.30.') ||
    ipAddress.startsWith('172.31.')
  )
}

/**
 * Busca localização completa do IP
 */
export async function getLocationFromIp(ipAddress: string): Promise<GeoLocation> {
  // IPs locais/privados: retornar Brasil (desenvolvimento)
  if (isPrivateOrLocalIp(ipAddress)) {
    return {
      country: 'Brazil',
      countryCode: 'BR',
      region: 'SP',
      city: 'São Paulo',
      lat: -23.5505,
      lon: -46.6333,
      isp: 'Local',
      status: 'success',
    }
  }

  // Verificar cache
  const cached = cache.get(ipAddress)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }

  try {
    const response = await fetch(`${IPAPI_URL}${ipAddress}?fields=status,country,countryCode,region,city,lat,lon,isp`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`GeoIP API error: ${response.status}`)
    }

    const data = await response.json() as GeoLocation

    if (data.status === 'fail') {
      throw new Error('GeoIP lookup failed')
    }

    // Salvar no cache
    cache.set(ipAddress, {
      data,
      expires: Date.now() + CACHE_TTL,
    })

    return data
  } catch (error) {
    console.error('GeoIP error:', error)
    // Em caso de erro, retornar Brasil (fail-open para não bloquear acesso)
    return {
      country: 'Brazil',
      countryCode: 'BR',
      region: '',
      city: '',
      lat: 0,
      lon: 0,
      isp: '',
      status: 'success', // Changed to success to avoid blocking
    }
  }
}

/**
 * Verifica se IP é do Brasil
 */
export async function isFromBrazil(ipAddress: string): Promise<boolean> {
  try {
    const location = await getLocationFromIp(ipAddress)
    return location.countryCode === 'BR'
  } catch {
    // Em caso de erro, permitir (fail-open)
    return true
  }
}

/**
 * Formata localização para exibição
 */
export function formatLocation(location: GeoLocation): string {
  const parts = [location.city, location.region, location.country].filter(Boolean)
  return parts.join(', ')
}
