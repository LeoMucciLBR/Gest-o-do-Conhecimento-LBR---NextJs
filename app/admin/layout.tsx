'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

type Session = {
  user: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session')
      if (!res.ok) {
        router.push('/login')
        return
      }

      const data = await res.json()
      
      // Check if user has admin role (case insensitive)
      const userRole = data.user?.role?.toUpperCase()
      if (userRole !== 'ADMIN') {
        router.push('/portal')
        return
      }

      setSession(data)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-lbr-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user?.role?.toUpperCase() !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Admin Header */}
      <div className="bg-red-600 text-white py-3 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <span className="font-semibold">Área Administrativa</span>
          <span className="ml-auto text-sm opacity-90">{session.user.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  )
}
