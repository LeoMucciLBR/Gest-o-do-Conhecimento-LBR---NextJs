'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/api'

export interface User {
  id: string
  email: string
  name?: string
  photoUrl?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load user session on mount
  useEffect(() => {
    let ignore = false

    async function loadSession() {
      try {
        const response = await apiFetch<{ user: User }>('/auth/session')
        if (!ignore) {
          setUser(response.user)
        }
      } catch (error) {
        if (!ignore) {
          setUser(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      ignore = true
    }
  }, [])

  const login = async (email: string, password: string) => {
    const response = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setUser(response.user)
    return response.user
  }

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
      router.push('/login')
      router.refresh()
    }
  }

  const refreshSession = async () => {
    try {
      const response = await apiFetch<{ user: User }>('/auth/session')
      setUser(response.user)
      return response.user
    } catch (error) {
      setUser(null)
      throw error
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshSession,
  }
}
