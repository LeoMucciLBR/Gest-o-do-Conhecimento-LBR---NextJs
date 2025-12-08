'use client'

import { ExternalLink, MessageSquare, Trash2, Eye } from 'lucide-react'

interface SoftwareCardProps {
  software: {
    id: string
    name: string
    description?: string | null
    link?: string | null
    provider?: {
      id: string
      name: string
    } | null
    _count: {
      comments: number
    }
  }
  onView: (software: any) => void
  onDelete: (id: string) => void
}

export default function SoftwareCard({ software, onView, onDelete }: SoftwareCardProps) {
  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-102 hover:-translate-y-1">
      {/* Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
        {software.name}
      </h3>

      {/* Provider Badge */}
      {software.provider && (
        <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full mb-3">
          {software.provider.name}
        </span>
      )}

      {/* Description */}
      {software.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {software.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {/* Comments Count */}
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">{software._count.comments}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {software.link && (
            <a
              href={software.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Abrir link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <button
            onClick={() => onView(software)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
            title="Visualizar"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(software.id)
            }}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 transition-opacity"
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
