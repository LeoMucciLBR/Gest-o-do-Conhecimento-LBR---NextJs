// API base URL - now using Next.js API routes
export const API_URL = '/api'

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include', // envia o cookie 'sid'
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  })
  if (!res.ok) {
    let errorData: any = { message: `Erro ${res.status}` }
    try {
      const j = await res.json()
      // Preservar todos os dados do erro (code, cooldownUntil, attemptsLeft, country, etc)
      errorData = j
      // Garantir que message existe
      if (!errorData.message && errorData.error) {
        errorData.message = errorData.error
      }
    } catch {}
    
    // Criar erro com todos os dados preservados
    const error: any = new Error(errorData.message || errorData.error || 'Erro desconhecido')
    error.code = errorData.code
    error.cooldownUntil = errorData.cooldownUntil
    error.attemptsLeft = errorData.attemptsLeft
    error.country = errorData.country
    throw error
  }
  return (await res.json()) as T
}

export async function logoutRequest() {
  await apiFetch('/auth/logout', { method: 'POST' })
}
