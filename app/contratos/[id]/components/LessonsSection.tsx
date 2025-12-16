'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  AlertTriangle, 
  Lightbulb, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Loader2,
  BookOpen,
  ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api/api'
import { useCustomAlert } from '@/components/ui/CustomAlert'

interface Lesson {
  id: string
  type: 'DIFICULDADE' | 'APRENDIZADO'
  title: string
  description: string | null
  created_at: string
  creator_name?: string
}

interface LessonsSectionProps {
  contractId: string
}

export default function LessonsSection({ contractId }: LessonsSectionProps) {
  const { showConfirm } = useCustomAlert()
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'TODOS' | 'DIFICULDADE' | 'APRENDIZADO'>('TODOS')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadLessons = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiFetch<{ lessons: Lesson[] }>(`/contracts/${contractId}/lessons`)
      setLessons(data.lessons || [])
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar registros')
    } finally {
      setLoading(false)
    }
  }, [contractId])

  useEffect(() => {
    loadLessons()
  }, [loadLessons])

  const handleDelete = async (lessonId: string, lessonTitle: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Registro',
      message: `Tem certeza que deseja excluir "${lessonTitle}"?`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      isDangerous: true
    })
    if (!confirmed) return

    try {
      await apiFetch(`/contracts/${contractId}/lessons/${lessonId}`, { method: 'DELETE' })
      toast.success('Registro excluído com sucesso!')
      setLessons(prev => prev.filter(l => l.id !== lessonId))
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir')
    }
  }

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingLesson(null)
    setIsModalOpen(true)
  }

  const handleSave = async (lessonData: { type: string; title: string; description: string }) => {
    try {
      if (editingLesson) {
        // Update
        await apiFetch(`/contracts/${contractId}/lessons/${editingLesson.id}`, {
          method: 'PUT',
          body: JSON.stringify(lessonData)
        })
        toast.success('Registro atualizado!')
      } else {
        // Create
        await apiFetch(`/contracts/${contractId}/lessons`, {
          method: 'POST',
          body: JSON.stringify(lessonData)
        })
        toast.success('Registro criado!')
      }
      setIsModalOpen(false)
      loadLessons()
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar')
    }
  }

  const filteredLessons = filter === 'TODOS' 
    ? lessons 
    : lessons.filter(l => l.type === filter)

  const difficulties = lessons.filter(l => l.type === 'DIFICULDADE')
  const learnings = lessons.filter(l => l.type === 'APRENDIZADO')

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Stats badges */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-red-500 dark:hover:border-red-500 transition-all duration-300 hover:scale-105 cursor-default">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-bold text-red-600 dark:text-red-400">{difficulties.length}</span>
            <span className="text-sm text-slate-600 dark:text-gray-400">Dificuldades</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-all duration-300 hover:scale-105 cursor-default">
            <Lightbulb className="w-5 h-5 text-green-500" />
            <span className="font-bold text-green-600 dark:text-green-400">{learnings.length}</span>
            <span className="text-sm text-slate-600 dark:text-gray-400">Aprendizados</span>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2f4982] to-blue-600 hover:from-[#263c6a] hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-[#2f4982]/30 hover:shadow-xl hover:shadow-[#2f4982]/40 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Adicionar Registro
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 dark:bg-gray-800 rounded-xl w-fit overflow-hidden">
        {(['TODOS', 'DIFICULDADE', 'APRENDIZADO'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-colors duration-300 ${
              filter === tab
                ? 'text-white'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <motion.div
              className={`absolute inset-0 rounded-lg ${
                filter === tab 
                  ? tab === 'DIFICULDADE' ? 'bg-red-500' :
                    tab === 'APRENDIZADO' ? 'bg-green-500' : 'bg-[#2f4982]'
                  : 'bg-transparent'
              }`}
              initial={false}
              animate={{
                opacity: filter === tab ? 1 : 0,
                scale: filter === tab ? 1 : 0.95
              }}
              transition={{ 
                duration: 0.25,
                ease: "easeInOut"
              }}
            />
            <span className="relative z-10 flex items-center gap-2">
              {tab === 'DIFICULDADE' && <AlertTriangle className="w-4 h-4" />}
              {tab === 'APRENDIZADO' && <Lightbulb className="w-4 h-4" />}
              {tab === 'TODOS' && <BookOpen className="w-4 h-4" />}
              {tab === 'TODOS' ? 'Todos' : tab === 'DIFICULDADE' ? 'Dificuldades' : 'Aprendizados'}
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#2f4982] animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredLessons.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-slate-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-gray-700"
        >
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-gray-300 mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-slate-500 dark:text-gray-400 mb-6">
            {filter === 'TODOS' 
              ? 'Adicione dificuldades e aprendizados deste contrato'
              : `Nenhum${filter === 'DIFICULDADE' ? 'a dificuldade' : ' aprendizado'} registrado`}
          </p>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2f4982] hover:bg-[#263c6a] text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Primeiro Registro
          </button>
        </motion.div>
      )}

      {/* Lessons list */}
      {!loading && filteredLessons.length > 0 && (
        <div className="space-y-6">
          {filter === 'TODOS' ? (
            <>
              {/* Dificuldades Section */}
              {difficulties.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Dificuldades ({difficulties.length})
                  </h4>
                  <AnimatePresence>
                    {difficulties.map((lesson, index) => (
                      <LessonCard 
                        key={lesson.id} 
                        lesson={lesson} 
                        index={index}
                        expandedId={expandedId}
                        setExpandedId={setExpandedId}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Aprendizados Section */}
              {learnings.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-green-500" />
                    Aprendizados ({learnings.length})
                  </h4>
                  <AnimatePresence>
                    {learnings.map((lesson, index) => (
                      <LessonCard 
                        key={lesson.id} 
                        lesson={lesson} 
                        index={index}
                        expandedId={expandedId}
                        setExpandedId={setExpandedId}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : (
            <AnimatePresence>
              {filteredLessons.map((lesson, index) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  index={index}
                  expandedId={expandedId}
                  setExpandedId={setExpandedId}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <LessonFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingLesson}
      />
    </div>
  )
}

// Lesson Card Component
interface LessonCardProps {
  lesson: Lesson
  index: number
  expandedId: string | null
  setExpandedId: (id: string | null) => void
  handleEdit: (lesson: Lesson) => void
  handleDelete: (id: string, title: string) => void
}

function LessonCard({ lesson, index, expandedId, setExpandedId, handleEdit, handleDelete }: LessonCardProps) {
  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:border-slate-300 dark:hover:border-gray-600"
    >
      {/* Type indicator bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        lesson.type === 'DIFICULDADE' ? 'bg-red-500' : 'bg-green-500'
      }`} />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Type badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${
              lesson.type === 'DIFICULDADE'
                ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
            }`}>
              {lesson.type === 'DIFICULDADE' ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5" />
              )}
              {lesson.type === 'DIFICULDADE' ? 'Dificuldade' : 'Aprendizado'}
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
              {lesson.title}
            </h3>

            {/* Description */}
            {lesson.description && (
              <div className="relative">
                <p className={`text-sm leading-relaxed text-slate-600 dark:text-gray-400 ${
                  expandedId === lesson.id ? '' : 'line-clamp-2'
                }`}>
                  {lesson.description}
                </p>
                {lesson.description.length > 100 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedId(expandedId === lesson.id ? null : lesson.id)
                    }}
                    className="mt-2 text-xs font-medium flex items-center gap-1 text-[#2f4982] dark:text-[#5a7ab8] hover:underline"
                  >
                    {expandedId === lesson.id ? 'Ver menos' : 'Ver mais'}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                      expandedId === lesson.id ? 'rotate-180' : ''
                    }`} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleEdit(lesson)}
              className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-400"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDelete(lesson.id, lesson.title)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 rounded-lg transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        {lesson.creator_name && (
          <p className="text-xs mt-3 text-slate-500 dark:text-gray-500">
            Criado por {lesson.creator_name} • {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </motion.div>
  )
}

// Form Modal Component
interface LessonFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { type: string; title: string; description: string }) => void
  initialData: Lesson | null
}

function LessonFormModal({ isOpen, onClose, onSave, initialData }: LessonFormModalProps) {
  const [type, setType] = useState<'DIFICULDADE' | 'APRENDIZADO'>('DIFICULDADE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setType(initialData.type)
      setTitle(initialData.title)
      setDescription(initialData.description || '')
    } else {
      setType('DIFICULDADE')
      setTitle('')
      setDescription('')
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    setSaving(true)
    try {
      await onSave({ type, title, description })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className={`px-6 py-4 ${
              type === 'DIFICULDADE' 
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  {type === 'DIFICULDADE' ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Lightbulb className="w-6 h-6" />
                  )}
                  {initialData ? 'Editar Registro' : 'Novo Registro'}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Type selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-3">
                  Tipo *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setType('DIFICULDADE')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all ${
                      type === 'DIFICULDADE'
                        ? 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300'
                        : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700'
                    }`}
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Dificuldade
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('APRENDIZADO')}
                    className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all ${
                      type === 'APRENDIZADO'
                        ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-300'
                        : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700'
                    }`}
                  >
                    <Lightbulb className="w-5 h-5" />
                    Aprendizado
                  </button>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Integração com os Sistemas da Concessionária"
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent transition-all text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva os detalhes..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-slate-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2f4982] focus:border-transparent transition-all text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition-all disabled:opacity-50 ${
                    type === 'DIFICULDADE'
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/30'
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg shadow-green-500/30'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
