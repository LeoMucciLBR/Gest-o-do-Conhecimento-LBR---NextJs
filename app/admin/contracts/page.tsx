'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RefreshCw, Search, Filter, Eye, Trash2, ArrowUpDown } from 'lucide-react'

interface Contract {
  id: string
  name: string
  status: string
  is_deleted: boolean
  created_at: string
  organization?: { name: string }
  created_by?: { name: string }
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ contracts: Contract[] }>('/admin/contracts')
      setContracts(data.contracts || [])
    } catch (err) {
      console.error('Error loading contracts', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
  }, [])

  const filtered = contracts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !c.is_deleted) ||
      (statusFilter === 'inactive' && c.is_deleted)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Contratos</h1>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border rounded"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <input
            type="text"
            placeholder="Buscar contrato..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-700 border rounded"
          />
          <button
            onClick={fetchContracts}
            disabled={loading}
            className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="p-2 text-left">Nome</th>
                <th className="p-2 text-left">Organização</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Criado em</th>
                <th className="p-2 text-left">Criador</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contract => (
                <tr key={contract.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-2">{contract.name}</td>
                  <td className="p-2">{contract.organization?.name || '-'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${contract.is_deleted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {contract.is_deleted ? 'Inativo' : contract.status}
                    </span>
                  </td>
                  <td className="p-2">{format(new Date(contract.created_at), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="p-2">{contract.created_by?.name || '-'}</td>
                  <td className="p-2 flex gap-2">
                    <button className="p-1 text-blue-600 hover:text-blue-800" title="Ver detalhes">
                      <Eye className="w-4 h-4" />
                    </button>
                    {contract.is_deleted ? (
                      <button className="p-1 text-green-600 hover:text-green-800" title="Restaurar">
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    ) : (
                      <button className="p-1 text-red-600 hover:text-red-800" title="Desativar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
