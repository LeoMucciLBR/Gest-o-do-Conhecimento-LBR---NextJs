'use client'

import { useState, useEffect, useRef } from 'react'
import { X, MapPin, Ruler, AlertTriangle, Plus, Trash2, Camera, Loader2, Save, ArrowLeft } from 'lucide-react'
import type { ObraWithGeometry } from './ObraMapViewer'
import { useAuth } from '@/lib/hooks/useAuth'

interface ObraAnnotationSidebarProps {
  obra: ObraWithGeometry | null
  isOpen: boolean
  onClose: () => void
  clickCoords?: { lat: number; lng: number } | null
  selectedNonConformityId?: string | null
  onBack?: () => void
}

interface NonConformity {
  id: string
  km: number
  description: string
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  status: 'ABERTA' | 'EM_ANDAMENTO' | 'RESOLVIDA'
  photos: NonConformityPhoto[]
  created_at: string
  user?: {
    full_name: string
  }
}

interface NonConformityPhoto {
  id: string
  storage_url: string
  caption: string | null
}

export default function ObraAnnotationSidebar({ obra, isOpen, onClose, clickCoords, selectedNonConformityId, onBack }: ObraAnnotationSidebarProps) {
  const { user } = useAuth()
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [showForm, setShowForm] = useState(false)
  const [newNcKm, setNewNcKm] = useState('')
  const [newNcDesc, setNewNcDesc] = useState('')
  const [newNcSeverity, setNewNcSeverity] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'>('BAIXA')
  const [newNcPhotos, setNewNcPhotos] = useState<File[]>([])
  const [snappedCoords, setSnappedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Effect to handle clickCoords
  useEffect(() => {
   if (isOpen && clickCoords && obra) {
      setShowForm(true)
      // Fetch KM AND coordinates from click location
      fetchKmFromCoords(clickCoords.lat, clickCoords.lng)
    }
  }, [clickCoords, isOpen, obra])

  const fetchKmFromCoords = async (lat: number, lng: number) => {
    if (!obra) return
    try {
      const res = await fetch(`/api/obras/${obra.id}/km-location?lat=${lat}&lng=${lng}`)
      if (res.ok) {
        const data = await res.json()
        console.log('KM API Response:', data)
        if (data.km) {
          setNewNcKm(data.km.toFixed(3))
          // Save snapped coordinates from km-location API
          if (data.latitude && data.longitude) {
            console.log('Setting snapped coords from km-location:', { lat: data.latitude, lng: data.longitude })
            setSnappedCoords({ lat: data.latitude, lng: data.longitude })
          }
        }
      }
    } catch (error) {
      console.error('Error fetching KM:', error)
    }
  }

  const fetchCoordsFromKm = async (km: number) => {
    if (!obra) return
    try {
      const res = await fetch(`/api/obras/${obra.id}/coordinates-from-km?km=${km}`)
      if (res.ok) {
        const data = await res.json()
        console.log('Coordinates from KM API Response:', data)
        if (data.latitude && data.longitude) {
          console.log('Setting snapped coords from KM:', { lat: data.latitude, lng: data.longitude })
          setSnappedCoords({ lat: data.latitude, lng: data.longitude })
        }
      } else {
        const errorText = await res.text()
        console.error('Error from coordinates-from-km API:', {
          status: res.status,
          statusText: res.statusText,
          error: errorText
        })
      }
    } catch (error) {
      console.error('Error fetching coordinates from KM:', error)
    }
  }

  useEffect(() => {
    if (isOpen && obra) {
      fetchNonConformities()
    } else {
      setNonConformities([])
      setShowForm(false)
      resetForm()
    }
  }, [isOpen, obra])

  const fetchNonConformities = async () => {
    if (!obra) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/obras/${obra.id}/non-conformities`)
      if (res.ok) {
        const data = await res.json()
        setNonConformities(data)
      }
    } catch (error) {
      console.error('Error fetching non-conformities:', error)
    } finally {
      setIsLoading(false)
    }
    }

  const resetForm = () => {
    setNewNcKm('')
    setNewNcDesc('')
    setNewNcSeverity('BAIXA')
    setNewNcPhotos([])
    setSnappedCoords(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!obra) return

    setIsSubmitting(true)
    try {
      // 1. Create Non-Conformity
      const res = await fetch(`/api/obras/${obra.id}/non-conformities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          km: parseFloat(newNcKm),
          description: newNcDesc,
          severity: newNcSeverity,
          status: 'ABERTA',
          latitude: snappedCoords?.lat,
          longitude: snappedCoords?.lng
        })
      })

      if (!res.ok) throw new Error('Failed to create non-conformity')
      
      const newNc = await res.json()

      // 2. Upload Photos (if any)
      if (newNcPhotos.length > 0) {
        for (const photo of newNcPhotos) {
          const formData = new FormData()
          formData.append('file', photo)
          
          await fetch(`/api/non-conformities/${newNc.id}/photos`, {
            method: 'POST',
            body: formData
          })
        }
      }

      await fetchNonConformities()
      setShowForm(false)
      resetForm()
      
      // Force refresh to show markers
      window.location.reload()
    } catch (error) {
      console.error('Error creating non-conformity:', error)
      alert('Erro ao criar não conformidade')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta não conformidade?')) return

    try {
      const res = await fetch(`/api/non-conformities/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setNonConformities(prev => prev.filter(nc => nc.id !== id))
      }
    } catch (error) {
      console.error('Error deleting non-conformity:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'BAIXA': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ALTA': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'CRITICA': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen || !obra) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-lbr-primary to-secondary p-6 text-white shadow-lg z-10 shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {selectedNonConformityId ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={onBack}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    Detalhes da NC
                  </h2>
                </div>
              ) : (
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                  <MapPin className="w-7 h-7" />
                  Trecho da Obra
                </h2>
              )}
              {!selectedNonConformityId && (
                <p className="text-white/90 font-semibold text-lg">
                  {obra.nome || `Obra #${obra.id}`}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Segment Info */}
          <div className="rounded-2xl p-6 border-2 border-blue-100 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/20">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-lbr-primary" />
              Informações do Trecho
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mb-1">UF</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{obra.uf}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mb-1">Rodovia</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{obra.nome || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mb-1">Km Início</p>
                <p className="text-lg font-bold text-lbr-primary dark:text-blue-400">{obra.km_inicio}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-600 dark:text-gray-400 mb-1">Km Fim</p>
                <p className="text-lg font-bold text-lbr-primary dark:text-blue-400">{obra.km_fim}</p>
              </div>
            </div>
          </div>

          {/* Non-Conformities Section */}
          {selectedNonConformityId ? (
            // Detail View
            (() => {
              // Show loading state while fetching
              if (isLoading) {
                return (
                  <div className="flex items-center justify-center p-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-lbr-primary mx-auto mb-2" />
                      <p className="text-slate-600 dark:text-gray-400">Carregando detalhes...</p>
                    </div>
                  </div>
                )
              }

              const selectedNc = nonConformities.find(nc => nc.id === selectedNonConformityId)
              if (!selectedNc) {
                return (
                  <div className="p-6 text-center">
                    <p className="text-slate-600 dark:text-gray-400 mb-4">Não conformidade não encontrada.</p>
                    <button onClick={onBack} className="px-4 py-2 bg-lbr-primary text-white rounded-lg hover:bg-lbr-primary/90 transition-colors">
                      Voltar
                    </button>
                  </div>
                )
              }

              return (
                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                  {/* Status and Severity */}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${getSeverityColor(selectedNc.severity)}`}>
                      {selectedNc.severity}
                    </span>
                    <span className="text-sm font-medium text-slate-500 dark:text-gray-400">
                      {selectedNc.status}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-1">Localização</h4>
                    <p className="text-2xl font-bold text-lbr-primary">KM {selectedNc.km}</p>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-2">Descrição</h4>
                    <p className="text-slate-600 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-slate-100 dark:border-gray-700">
                      {selectedNc.description}
                    </p>
                  </div>

                  {/* Photos Gallery */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Fotos Registradas
                    </h4>
                    {selectedNc.photos && selectedNc.photos.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedNc.photos.map(photo => (
                          <div key={photo.id} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 group cursor-pointer hover:shadow-lg transition-all">
                            <img
                              src={photo.storage_url}
                              alt={photo.caption || 'Foto da não conformidade'}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 text-slate-500">
                        Nenhuma foto registrada.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-slate-100 dark:border-gray-700">
                    <button
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta não conformidade?')) {
                          handleDelete(selectedNc.id)
                          if (onBack) onBack()
                        }
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-medium"
                    >
                      <Trash2 className="w-5 h-5" />
                      Excluir Não Conformidade
                    </button>
                  </div>
                </div>
              )
            })()
          ) : (
            // List View
            <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Não Conformidades
              </h3>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-3 py-1.5 bg-lbr-primary text-white rounded-lg hover:bg-lbr-primary-hover transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Nova
              </button>
            </div>

            {/* New NC Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 border border-slate-200 dark:border-gray-600 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      KM Local
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      value={newNcKm}
                      onChange={(e) => setNewNcKm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lbr-primary"
                      placeholder="Ex: 125.500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Severidade
                    </label>
                    <select
                      value={newNcSeverity}
                      onChange={(e) => setNewNcSeverity(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lbr-primary"
                    >
                      <option value="BAIXA">Baixa</option>
                      <option value="MEDIA">Média</option>
                      <option value="ALTA">Alta</option>
                      <option value="CRITICA">Crítica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
                      Descrição
                    </label>
                    <textarea
                      required
                      value={newNcDesc}
                      onChange={(e) => setNewNcDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-lbr-primary min-h-[80px]"
                      placeholder="Descreva a não conformidade..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Fotos (Opcional)
                    </label>
                    <div className="space-y-4">
                      {/* Upload Area */}
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          ref={fileInputRef}
                          onChange={(e) => {
                            if (e.target.files) {
                              setNewNcPhotos(prev => [...prev, ...Array.from(e.target.files || [])])
                            }
                          }}
                          className="hidden"
                          id="nc-photo-upload"
                        />
                        <label
                          htmlFor="nc-photo-upload"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-700/50 hover:border-lbr-primary transition-all group"
                        >
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <div className="p-3 bg-slate-100 dark:bg-gray-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
                              <Camera className="w-6 h-6 text-slate-500 dark:text-gray-400 group-hover:text-lbr-primary" />
                            </div>
                            <p className="mb-1 text-sm text-slate-500 dark:text-gray-400">
                              <span className="font-semibold text-lbr-primary">Clique para enviar</span> ou arraste
                            </p>
                            <p className="text-xs text-slate-400 dark:text-gray-500">
                              PNG, JPG ou JPEG
                            </p>
                          </div>
                        </label>
                      </div>
                      
                      {/* Photo Preview Grid */}
                      {newNcPhotos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          {newNcPhotos.map((photo, index) => (
                            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Preview ${index}`}
                                className="w-full h-full object-cover"
                                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => setNewNcPhotos(prev => prev.filter((_, i) => i !== index))}
                                  className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                                  title="Remover foto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/60 to-transparent">
                                <p className="text-[10px] text-white truncate px-1">
                                  {photo.name}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-3 py-2 text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-4 py-2 bg-lbr-primary text-white rounded-lg hover:bg-lbr-primary-hover transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Salvar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-lbr-primary" />
                </div>
              ) : nonConformities.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-slate-200 dark:border-gray-700">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma não conformidade registrada.</p>
                </div>
              ) : (
                nonConformities.map((nc) => (
                  <div
                    key={nc.id}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getSeverityColor(nc.severity)}`}>
                          {nc.severity}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          KM {nc.km}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(nc.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <p className="text-sm text-slate-600 dark:text-gray-300 mb-3">
                      {nc.description}
                    </p>

                    {nc.photos && nc.photos.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {nc.photos.map(photo => (
                          <div key={photo.id} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-700">
                            <img
                              src={photo.storage_url}
                              alt={photo.caption || 'Foto da não conformidade'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50 dark:border-gray-700/50">
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        {new Date(nc.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500 dark:text-gray-400">
                        {nc.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}
        </div>
      </div>
    </>
  )
}
