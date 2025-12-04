'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import 'react-quill-new/dist/quill.snow.css'

// Dynamic import to avoid SSR issues with document/window
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false }) as any

interface RichTextEditorProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ header: [1, 2, 3, false] }],
        ['clean'],
      ],
    }),
    []
  )

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
  ]

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-slate-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-lbr-primary/50 focus-within:border-lbr-primary transition-all shadow-sm">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="text-slate-900 dark:text-white [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 [&_.ql-toolbar]:dark:border-gray-700 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-base"
        />
      </div>
      <style jsx global>{`
        .ql-toolbar.ql-snow {
          background-color: rgba(248, 250, 252, 0.5);
          border-color: inherit;
        }
        .dark .ql-toolbar.ql-snow {
          background-color: rgba(31, 41, 55, 0.5);
        }
        .ql-container.ql-snow {
          border: none;
        }
        .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .dark .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        .ql-snow .ql-stroke {
          stroke: #64748b;
        }
        .dark .ql-snow .ql-stroke {
          stroke: #9ca3af;
        }
        .ql-snow .ql-fill {
          fill: #64748b;
        }
        .dark .ql-snow .ql-fill {
          fill: #9ca3af;
        }
        .ql-snow .ql-picker {
          color: #64748b;
        }
        .dark .ql-snow .ql-picker {
          color: #9ca3af;
        }
      `}</style>
    </div>
  )
}
