'use client'

import { Check, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface InputWithValidationProps {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  placeholder: string
  required?: boolean
  type?: string
  as?: 'input' | 'textarea'
  rows?: number
  error?: string
}

export default function InputWithValidation({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  as = 'input',
  rows,
  error,
}: InputWithValidationProps) {
  const validateEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const validatePhone = (phone: string): boolean => {
    const clean = phone.replace(/\D/g, '')
    return clean.length === 10 || clean.length === 11
  }

  const formatPhone = (phone: string): string => {
    const clean = phone.replace(/\D/g, '')
    if (clean.length <= 10) {
      return clean
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .slice(0, 14)
    }
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15)
  }

  const formatCurrency = (value: string): string => {
    // Remove tudo exceto números
    const clean = value.replace(/\D/g, '')
    
    // Se não houver números, retorna vazio
    if (!clean) return ''
    
    // Converte para número e divide por 100 para considerar os centavos
    const number = parseFloat(clean) / 100
    
    // Formata como moeda brasileira
    return number.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  let isValid = false
  let errorMessage = error || ''

  if (value.trim().length > 0) {
    if (type === 'email') {
      isValid = validateEmail(value)
      if (!isValid) errorMessage = 'Email inválido'
    } else if (type === 'tel') {
      isValid = validatePhone(value)
      if (!isValid) errorMessage = 'Telefone inválido (use 10 ou 11 dígitos)'
    } else if (type === 'currency') {
      // Para moeda, considera válido se tiver algum valor numérico
      const clean = value.replace(/\D/g, '')
      isValid = clean.length > 0
      if (!isValid) errorMessage = 'Valor inválido'
    } else {
      isValid = value.trim().length > 0
    }
  }

  const showValidation = value.trim().length > 0
  const showError = showValidation && (!isValid || !!error)

  const Component = as
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (type === 'tel') {
      const formatted = formatPhone(e.target.value)
      e.target.value = formatted
    } else if (type === 'currency') {
      const formatted = formatCurrency(e.target.value)
      e.target.value = formatted
    }
    onChange(e)
  }

  return (
    <div className="group relative">
      <label className="block text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <Component
          type={as === 'input' ? type : undefined}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={as === 'textarea' ? rows : undefined}
          className={`w-full px-4 py-3 rounded-xl border-2 bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
            as === 'textarea' ? 'resize-none' : ''
          } ${
            showError
              ? 'border-red-300 dark:border-red-700 focus:ring-red-500 pr-12'
              : showValidation && isValid
              ? 'border-green-300 dark:border-green-700 focus:ring-green-500 pr-12'
              : 'border-slate-200 dark:border-gray-700 focus:ring-blue-500 group-hover:border-blue-300 dark:group-hover:border-blue-600'
          }`}
          required={required}
        />
        {showValidation && isValid && !error && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in duration-300">
            <Check className="w-5 h-5" strokeWidth={3} />
          </div>
        )}
        {showError && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 animate-in fade-in zoom-in duration-300">
            <X className="w-5 h-5" strokeWidth={3} />
          </div>
        )}
      </div>
      {showError && (
        <p className="text-red-500 dark:text-red-400 text-xs mt-1 animate-in fade-in slide-in-from-top-1 duration-300">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
