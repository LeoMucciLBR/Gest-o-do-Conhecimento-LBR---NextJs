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
    let msg = `Erro ${res.status}`
    try {
      const j = await res.json()
      if (j?.error) msg = j.error
      else if (j?.message) msg = j.message
    } catch {}
    throw new Error(msg)
  }
  return (await res.json()) as T
}

export async function logoutRequest() {
  await apiFetch('/auth/logout', { method: 'POST' })
}
