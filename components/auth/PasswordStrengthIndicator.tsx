'use client'

import { Check, X } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  // Requisitos
  const requirements = [
    { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Letra maiúscula', valid: /[A-Z]/.test(password) },
    { label: 'Letra minúscula', valid: /[a-z]/.test(password) },
    { label: 'Número', valid: /\d/.test(password) },
    { label: 'Caractere especial (!@#$...)', valid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ]

  // Calcular força (0-100)
  const validCount = requirements.filter((r) => r.valid).length
  const strength = (validCount / requirements.length) * 100

  // Cor baseada na força
  const getColor = () => {
    if (strength <= 40) return 'bg-red-500'
    if (strength <= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getLabel = () => {
    if (strength <= 40) return 'Fraca'
    if (strength <= 80) return 'Média'
    return 'Forte'
  }

  return (
    <div className="space-y-4">
      {/* Barra de progresso */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-300">
          <span>Força da senha</span>
          <span className={strength === 100 ? 'text-green-400' : 'text-slate-400'}>
            {getLabel()}
          </span>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getColor()}`}
            style={{ width: `${strength}%` }}
          />
        </div>
      </div>

      {/* Lista de requisitos */}
      <div className="grid grid-cols-1 gap-2">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
              req.valid ? 'text-green-400' : 'text-slate-400'
            }`}
          >
            {req.valid ? (
              <Check className="w-3 h-3 flex-shrink-0" />
            ) : (
              <div className="w-3 h-3 rounded-full border border-slate-500 flex-shrink-0" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
