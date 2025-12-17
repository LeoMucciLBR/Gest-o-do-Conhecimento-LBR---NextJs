'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Map as MapIcon, Loader2, Info, Building2, MapPin, ChevronRight } from 'lucide-react'
import ObraMapViewer, { type ObraWithGeometry } from '@/app/contratos/[id]/components/ObraMapViewer'
import { apiFetch } from '@/lib/api/api'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Extended type with contract info
interface ObraWithContract extends ObraWithGeometry {
  contract_id?: string
  contract_name?: string
}

// Contract summary for table
interface ContractSummary {
  id: string
  name: string
  obrasCount: number
  obras: ObraWithContract[]
}

export default function MapaObrasPage() {
  const router = useRouter()
  const [obras, setObras] = useState<ObraWithContract[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredContractId, setHoveredContractId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchObras() {
      try {
        const data = await apiFetch<any[]>('/obras-geral')
        
        console.log('[MapaObras] Raw API response:', data)
        console.log('[MapaObras] Number of obras:', data?.length || 0)
        
        // Debug: log geometry types
        if (data && data.length > 0) {
          const geometryTypes = data.map(item => ({
            id: item.id,
            hasGeometria: !!item.geometria,
            geometriaType: item.geometria?.type || 'NO_TYPE',
          }))
          console.log('[MapaObras] Geometry types:', geometryTypes)
        }
        
        const mappedObras: ObraWithContract[] = data.map(item => ({
          id: item.id,
          nome: item.nome || `Obra ${item.id}`,
          km_inicio: item.km_inicio,
          km_fim: item.km_fim,
          uf: item.uf,
          geometria: item.geometria,
          contract_id: item.contract_id,
          contract_name: item.contract_name,
          ...item
        }))

        console.log('[MapaObras] Mapped obras with geometry:', mappedObras.filter(o => o.geometria).length)
        setObras(mappedObras)
      } catch (error) {
        console.error('[MapaObras] Failed to fetch obras:', error)
        toast.error('Erro ao carregar mapa de obras')
      } finally {
        setLoading(false)
      }
    }

    fetchObras()
  }, [])

  // Group obras by contract
  const contracts = useMemo<ContractSummary[]>(() => {
    const contractMap = new Map<string, ContractSummary>()
    
    obras.forEach(obra => {
      if (!obra.contract_id) return
      
      if (!contractMap.has(obra.contract_id)) {
        contractMap.set(obra.contract_id, {
          id: obra.contract_id,
          name: obra.contract_name || 'Contrato sem nome',
          obrasCount: 0,
          obras: []
        })
      }
      
      const contract = contractMap.get(obra.contract_id)!
      contract.obrasCount++
      contract.obras.push(obra)
    })
    
    return Array.from(contractMap.values())
  }, [obras])

  // Get highlighted obra IDs based on hovered contract
  const highlightedObraIds = useMemo(() => {
    if (!hoveredContractId) return new Set<number>()
    const contract = contracts.find(c => c.id === hoveredContractId)
    return new Set(contract?.obras.map(o => o.id) || [])
  }, [hoveredContractId, contracts])

  const handleObraClick = (obra: ObraWithGeometry) => {
    const contractId = (obra as ObraWithContract).contract_id
    if (contractId) {
      router.push(`/contratos/${contractId}`)
    }
  }

  const handleContractClick = (contractId: string) => {
    router.push(`/contratos/${contractId}`)
  }

  return (
    <div className="p-6 h-full flex flex-col overflow-hidden">
      <header className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
            <MapIcon className="w-8 h-8" />
          </div>
          Mapa Geral de Obras
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
          Visualização consolidada de todas as rodovias. Passe o mouse sobre um contrato na tabela para destacar suas obras no mapa.
        </p>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">Carregando mapa...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 min-h-0">
          {/* Map Section */}
          <div className="flex-1 min-h-[400px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
          <ObraMapViewer 
              obras={obras}
              height="600px"
              className="w-full h-full border-0 rounded-none shadow-none"
              onObraClick={handleObraClick}
              hoveredObraIds={highlightedObraIds.size > 0 ? highlightedObraIds : null}
            />
            
            {/* Legend */}
            <div className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-1 bg-blue-500 rounded"></div>
                <span className="text-slate-600 dark:text-slate-400">Obras cadastradas</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1">
                <div className="w-3 h-1 bg-yellow-500 rounded"></div>
                <span className="text-slate-600 dark:text-slate-400">Destaque (hover)</span>
              </div>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="h-[250px] bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-slate-900 dark:text-white">Contratos com Obras</h2>
              <span className="ml-auto text-sm text-slate-500 dark:text-slate-400">
                {contracts.length} contratos • {obras.length} obras
              </span>
            </div>
            
            <div className="overflow-auto h-[calc(100%-60px)]">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Contrato</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Obras</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Trechos</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {contracts.map((contract) => (
                    <motion.tr
                      key={contract.id}
                      className={`cursor-pointer transition-colors ${
                        hoveredContractId === contract.id 
                          ? 'bg-blue-50 dark:bg-blue-900/30' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                      }`}
                      onMouseEnter={() => setHoveredContractId(contract.id)}
                      onMouseLeave={() => setHoveredContractId(null)}
                      onClick={() => handleContractClick(contract.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {contract.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                          <MapPin className="w-3 h-3" />
                          {contract.obrasCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {contract.obras.map(o => o.nome).slice(0, 2).join(', ')}
                        {contract.obras.length > 2 && ` +${contract.obras.length - 2}`}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-5 h-5 text-slate-400 inline-block" />
                      </td>
                    </motion.tr>
                  ))}
                  {contracts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                        Nenhum contrato com obras encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
