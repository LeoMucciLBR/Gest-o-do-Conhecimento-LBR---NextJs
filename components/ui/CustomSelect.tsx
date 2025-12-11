'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface CustomSelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
}

export default function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione uma opção',
  required = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 pr-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-2 border-slate-300 dark:border-gray-600 rounded-xl text-left text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300 hover:border-blue-500/50 dark:hover:border-blue-400/50 flex items-center justify-between"
      >
        <span className={selectedOption ? '' : 'text-slate-400 dark:text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-slate-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="p-3 border-b border-slate-200 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900/50 border border-slate-200 dark:border-gray-600 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                    option.value === value
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-50 dark:hover:bg-gray-700/50 text-slate-900 dark:text-white'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.value === value && (
                    <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-500 dark:text-gray-400">
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
