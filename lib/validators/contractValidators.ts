/**
 * Validators Zod para Contratos
 * 
 * Centralizando validação de entrada para reuso em:
 * - API Routes (server-side validation)
 * - Formulários React Hook Form (client-side validation)
 */

import { z } from 'zod'

// ============================================
// Enums e Constantes
// ============================================

export const CONTRACT_STATUS = ['Ativo', 'Inativo', 'Pendente'] as const
export const TIPO_RODOVIA = ['FEDERAL', 'ESTADUAL', 'PONTO_FIXO'] as const
export const PARTICIPANT_ROLES = [
  'GESTOR_AREA',
  'GERENTE_ENGENHARIA',
  'COORDENADORA',
  'ENGENHEIRO_RESPONSAVEL',
  'GERENTE_PROJETO',
  'ANALISTA',
  'OUTRO',
] as const

export const UF_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

// ============================================
// Schemas Base
// ============================================

export const organizationSchema = z.object({
  name: z.string().min(2, 'Nome da organização deve ter pelo menos 2 caracteres').max(255),
})

export const personSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(255),
  email: z.string().email('Email inválido').nullish().or(z.literal('')),
  phone: z.string().max(20).nullish(),
  office: z.string().max(100).nullish(),
})

export const participantSchema = z.object({
  role: z.enum(PARTICIPANT_ROLES),
  personId: z.string().uuid('ID de pessoa inválido').optional(),
  person: personSchema.optional(),
  custom_role: z.string().max(100).nullish(),
}).refine(
  (data) => data.personId || data.person,
  { message: 'Participante deve ter personId ou dados da pessoa' }
)

export const obraSchema = z.object({
  tipoRodovia: z.enum(TIPO_RODOVIA),
  uf: z.enum(UF_BRASIL).optional(),
  rodoviaId: z.number().int().positive().optional(),
  brCodigo: z.string().max(10).optional(),
  kmInicio: z.number().min(0, 'KM início deve ser positivo'),
  kmFim: z.number().min(0, 'KM fim deve ser positivo'),
  nome: z.string().max(200).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => data.kmFim >= data.kmInicio,
  { message: 'KM fim deve ser maior ou igual ao KM início', path: ['kmFim'] }
).refine(
  (data) => {
    if (data.tipoRodovia === 'FEDERAL') {
      return data.brCodigo && data.uf
    }
    if (data.tipoRodovia === 'ESTADUAL') {
      return data.rodoviaId
    }
    if (data.tipoRodovia === 'PONTO_FIXO') {
      return data.lat !== undefined && data.lng !== undefined
    }
    return true
  },
  { message: 'Dados incompletos para o tipo de rodovia selecionado' }
)

export const companyParticipationSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').max(255),
  participationPercentage: z.number().min(0).max(100, 'Porcentagem deve ser entre 0 e 100'),
})

export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().max(100),
  data: z.string(), // Base64
})

// ============================================
// Schema Principal de Criação de Contrato
// ============================================

export const createContractSchema = z.object({
  // Campos obrigatórios
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
  
  // Campos opcionais
  sector: z.string().max(100).nullish(),
  object: z.string().max(2000).nullish(),
  scope: z.string().max(5000).nullish(),
  caracteristicas: z.string().max(5000).nullish(),
  status: z.enum(CONTRACT_STATUS).default('Ativo'),
  location: z.string().max(500).nullish(),
  client_office_location: z.string().max(500).nullish(),
  lbr_office_location: z.string().max(500).nullish(),
  
  // Datas
  dataInicio: z.string().datetime({ offset: true }).nullish().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish()),
  dataFim: z.string().datetime({ offset: true }).nullish().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish()),
  
  // Valor
  valor: z.string().max(50).nullish(),
  
  // Organização (uma das opções)
  organizationId: z.string().uuid().nullish(),
  organization: organizationSchema.optional(),
  
  // Relacionamentos
  participants: z.array(participantSchema).optional(),
  obras: z.array(obraSchema).optional(),
  companyParticipations: z.array(companyParticipationSchema).optional(),
  
  // Arquivos
  laminaFile: fileUploadSchema.optional(),
  coverImageFile: fileUploadSchema.optional(),
}).refine(
  (data) => data.organizationId || data.organization,
  { message: 'Organização é obrigatória (organizationId ou organization.name)' }
)

// ============================================
// Schema de Atualização de Contrato
// ============================================

export const updateContractSchema = createContractSchema.partial().extend({
  id: z.string().uuid('ID do contrato inválido'),
})

// ============================================
// Schema de Listagem/Filtros
// ============================================

export const listContractsQuerySchema = z.object({
  q: z.string().max(255).optional(),
  status: z.enum(CONTRACT_STATUS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
})

// ============================================
// Types inferidos dos Schemas
// ============================================

export type CreateContractInput = z.infer<typeof createContractSchema>
export type UpdateContractInput = z.infer<typeof updateContractSchema>
export type ListContractsQueryInput = z.infer<typeof listContractsQuerySchema>
export type ParticipantInput = z.infer<typeof participantSchema>
export type ObraInput = z.infer<typeof obraSchema>
export type CompanyParticipationInput = z.infer<typeof companyParticipationSchema>

// ============================================
// Funções de Validação Helper
// ============================================

/**
 * Valida dados de criação de contrato
 * @returns { success: true, data } ou { success: false, error }
 */
export function validateCreateContract(data: unknown) {
  return createContractSchema.safeParse(data)
}

/**
 * Valida dados de atualização de contrato
 */
export function validateUpdateContract(data: unknown) {
  return updateContractSchema.safeParse(data)
}

/**
 * Valida query params de listagem
 */
export function validateListQuery(params: Record<string, string | undefined>) {
  return listContractsQuerySchema.safeParse(params)
}
