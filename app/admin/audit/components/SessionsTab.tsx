'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  Trash2,
  MapPin,
  Laptop,
  RefreshCw,
  User
} from 'lucide-react'
import { apiFetch } from '@/lib/api/api'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Session {
  id: string
  userId: string
  user: {
    name: string | null
    email: string
    picture_url: string | null
  }
  ipAddress: string | null
  userAgent: string | null
  location: string | null
  lastActivity: string
  createdAt: string
  isCurrent: boolean
}

export default function SessionsTab() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ sessions: Session[] }>('/admin/sessions')
      setSessions(data.sessions)
    } catch (error) {
      console.error('Failed to fetch sessions', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleRevoke = async (sessionId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja derrubar esta sessão? O usuário será desconectado.')) return

    setRevokingId(sessionId)
    try {
      await apiFetch('/admin/sessions/revoke', {
        method: 'POST',
        body: JSON.stringify({ sessionId, userId, reason: 'Admin revoked session' }),
      })
      
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error) {
      alert('Erro ao revogar sessão')
    } finally {
      setRevokingId(null)
    }
  }

  const getDeviceIcon = (userAgent: string | null) => {
    if (!userAgent) return <Monitor className="w-6 h-6" />
    if (userAgent.toLowerCase().includes('mobile')) return <Smartphone className="w-6 h-6" />
    return <Laptop className="w-6 h-6" />
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Sessões Ativas
            <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm font-semibold">
              {sessions.length} Online
            </span>
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Usuários conectados em tempo real
          </p>
        </div>

        <button
          onClick={fetchSessions}
          disabled={loading}
          className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-700 rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <Monitor className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão ativa encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-5 shadow-lg border border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all relative group"
              >
                {/* Animated border glow on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative">
                  {/* User Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {session.user?.picture_url ? (
                        <img 
                          src={session.user.picture_url} 
                          alt="" 
                          className="w-12 h-12 rounded-full ring-2 ring-orange-500/20" 
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                          {session.user?.name || 'Usuário'}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                          {session.user?.email || 'Email não disponível'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                      {getDeviceIcon(session.userAgent)}
                    </div>
                  </div>

                  {/* Session Details */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{session.location || 'Localização desconhecida'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-mono text-xs">{session.ipAddress || 'IP Oculto'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs">
                        Ativo {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={() => handleRevoke(session.id, session.userId)}
                      disabled={revokingId === session.id}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {revokingId === session.id ? (
                        <span className="animate-pulse">Revogando...</span>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Derrubar Sessão
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
