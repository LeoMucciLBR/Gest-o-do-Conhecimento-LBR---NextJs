// Validar força da senha
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
  strength: 'weak' | 'medium' | 'strong'
  score: number // 0-100
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  // Requisitos mínimos
  if (password.length < 8) {
    errors.push('A senha deve ter no mínimo 8 caracteres')
  } else {
    score += 20
    if (password.length >= 12) score += 10
    if (password.length >= 16) score += 10
  }

  // Letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula')
  } else {
    score += 15
  }

  // Letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula')
  } else {
    score += 15
  }

  // Número
  if (!/\d/.test(password)) {
    errors.push('A senha deve conter pelo menos um número')
  } else {
    score += 15
  }

  // Caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%^&* etc)')
  } else {
    score += 15
  }

  // Pontuação adicional
  // Diversidade de caracteres
  const uniqueChars = new Set(password).size
  if (uniqueChars >= password.length * 0.6) {
    score += 10
  }

  // Sequências comuns (reduz pontuação)
  const commonSequences = ['123', 'abc', 'qwerty', 'password', 'admin']
  const lowerPassword = password.toLowerCase()
  for (const seq of commonSequences) {
    if (lowerPassword.includes(seq)) {
      score -= 10
      errors.push(`Evite usar sequências comuns como "${seq}"`)
      break
    }
  }

  // Determinar força
  let strength: 'weak' | 'medium' | 'strong'
  if (score < 40) {
    strength = 'weak'
  } else if (score < 70) {
    strength = 'medium'
  } else {
    strength = 'strong'
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(100, score)),
  }
}

// Gerar senha temporária aleatória
export function generateTemporaryPassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // Remove I, O
  const lowercase = 'abcdefghjkmnpqrstuvwxyz' // Remove i, l, o
  const numbers = '23456789' // Remove 0, 1
  const special = '!@#$%&*'

  const all = uppercase + lowercase + numbers + special

  let password = ''
  
  // Garantir pelo menos um de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Preencher o resto
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Embaralhar
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

// Verificar se a senha é comum/fraca demais
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '12345678',
    'password123',
    'admin123',
    'qwerty123',
    'senha123',
    '123456789',
    'abc123456',
  ]

  const lowerPassword = password.toLowerCase()
  return commonPasswords.some((common) => lowerPassword.includes(common))
}

// Obter dicas de melhoria
export function getPasswordSuggestions(password: string): string[] {
  const suggestions: string[] = []
  const validation = validatePasswordStrength(password)

  if (validation.strength === 'weak') {
    suggestions.push('Sua senha está fraca. Considere torná-la mais complexa.')
  }

  if (password.length < 12) {
    suggestions.push('Use pelo menos 12 caracteres para maior segurança')
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
    suggestions.push('Misture letras maiúsculas e minúsculas')
  }

  if (!/\d/.test(password)) {
    suggestions.push('Adicione números para aumentar a complexidade')
  }

  if (!/[!@#$%^&*]/.test(password)) {
    suggestions.push('Inclua caracteres especiais (!@#$%^&*)')
  }

  if (isCommonPassword(password)) {
    suggestions.push('Evite senhas comuns ou previsíveis')
  }

  const repeatingPattern = /(.)\1{2,}/.test(password)
  if (repeatingPattern) {
    suggestions.push('Evite repetir o mesmo caractere consecutivamente')
  }

  return suggestions
}
