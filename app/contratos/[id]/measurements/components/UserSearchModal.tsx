'use client'

import { useState, useEffect } from 'react'
import { Search, Loader2, User, X } from 'lucide-react'
import { toast } from 'sonner'
import Avatar from '@/components/ui/Avatar' // Assuming we have an Avatar component, or I'll use a placeholder

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface UserSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectUser: (user: User) => void
}

export default function UserSearchModal({ isOpen, onClose, onSelectUser }: UserSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) { // Only search if at least 2 chars
        fetchUsers()
      } else {
        setUsers([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  async function fetchUsers() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}&limit=10`)
      if (!res.ok) throw new Error('Falha ao buscar usuários')
      
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error(error)
      // toast.error('Erro ao buscar usuários') // Avoid spamming toasts on typing
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Adicionar Fornecedor
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm">Buscando...</p>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-1">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 group-hover:bg-blue-200 dark:group-hover:bg-blue-800 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>Nenhum usuário encontrado.</p>
            </div>
          ) : (
             <div className="py-8 text-center text-gray-400 dark:text-gray-500">
              <p className="text-sm">Digite para pesquisar...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
