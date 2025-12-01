'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, 
  Smartphone, 
  Globe, 
  Clock, 
  Trash2, 
  AlertTriangle,
  MapPin,
  Laptop
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

export default function SessionsPage() {
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
  }, [])

  const handleRevoke = async (sessionId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja derrubar esta sessão? O usuário será desconectado.')) return

    setRevokingId(sessionId)
    try {
      await apiFetch('/admin/sessions/revoke', {
        method: 'POST',
        body: JSON.stringify({ sessionId, userId, reason: 'Admin revoked session' }),
      })
      
      // Remove from list locally
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Globe className="w-8 h-8 text-purple-600" />
            Sessões Ativas
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Gerencie usuários conectados em tempo real
          </p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg font-semibold">
          {sessions.length} Online
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse h-48"></div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <Monitor className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Nenhuma sessão ativa encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {sessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {session.user?.picture_url ? (
                      <img src={session.user.picture_url} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                        {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                        {session.user?.name || 'Usuário'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {session.user?.email || 'Email não disponível'}
                      </p>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}>
                    {getDeviceIcon(session.userAgent)}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{session.location || 'Localização desconhecida'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Globe className="w-4 h-4 text-slate-400" />
                    <span className="font-mono text-xs">{session.ipAddress || 'IP Oculto'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      Ativo há {formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                  <button
                    onClick={() => handleRevoke(session.id, session.userId)}
                    disabled={revokingId === session.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
