/**
 * Validators Zod para Usuários e Autenticação
 */

import { z } from 'zod'

// ============================================
// Constantes
// ============================================

export const USER_ROLES = ['user', 'admin', 'ADMIN', 'USER'] as const

// ============================================
// Schemas de Autenticação
// ============================================

export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128),
})

export const registerSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(255)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Senhas não conferem', path: ['confirmPassword'] }
)

export const resetPasswordRequestSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .transform((v) => v.toLowerCase().trim()),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'
    ),
})

// ============================================
// Schemas de Usuário
// ============================================

export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  picture_url: z.string().url().nullish(),
})

// ============================================
// Types
// ============================================

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>

// ============================================
// Funções Helper
// ============================================

export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data)
}

export function validateRegister(data: unknown) {
  return registerSchema.safeParse(data)
}

export function validateChangePassword(data: unknown) {
  return changePasswordSchema.safeParse(data)
}
