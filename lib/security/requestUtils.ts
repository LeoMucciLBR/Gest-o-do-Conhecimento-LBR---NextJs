import { NextRequest } from 'next/server'

/**
 * Extrai o IP real do request
 * Considera proxies reversos (Cloudflare, Nginx, etc)
 */
export function getRealIp(request: NextRequest): string {
  // Tentar headers comuns de proxy
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  // Cloudflare (prioritário se disponível)
  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  // X-Real-IP
  if (realIp) {
    return realIp
  }
  
  // X-Forwarded-For (pegar o primeiro IP da lista)
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    return ips[0]
  }
  
  // Fallback: IP na conexão direta
  // No Next.js Edge, pode não estar disponível
  return '127.0.0.1' // localhost como fallback safe
}

/**
 * Extrai User-Agent do request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown'
}
