import { z } from 'zod'

// Location schema
export const locationSchema = z.object({
  texto: z.string(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  placeId: z.string().nullable(),
})

export type LocationValue = z.infer<typeof locationSchema>

// Person schema
const personSchema = z.object({
  full_name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').or(z.literal('')).nullable(),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido').or(z.literal('')).nullable(),
  office: z.string().nullable(),
})

// Participant schema
const participantSchema = z.object({
  role: z.enum(['GESTOR_AREA', 'GERENTE_ENGENHARIA', 'COORDENADORA', 'ENGENHEIRO_RESPONSAVEL']),
  person: personSchema,
})

// Obra schema
const obraSchema = z.object({
  tipoRodovia: z.enum(['FEDERAL', 'ESTADUAL']),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
  rodoviaId: z.number().int().positive().optional().nullable(),
  brCodigo: z.string().optional().nullable(),
  kmInicio: z.number().min(0, 'KM inicial deve ser positivo'),
  kmFim: z.number().min(0, 'KM final deve ser positivo'),
})

// Main contract form schema
export const contractFormSchema = z.object({
  // Geral
  nomeContrato: z.string().min(1, 'Nome do contrato é obrigatório'),
  contratante: z.string().min(1, 'Contratante é obrigatório'),
  setor: z.string(),
  objetoContrato: z.string().min(1, 'Objeto do contrato é obrigatório'),
  escopoContrato: z.string().min(1, 'Escopo do contrato é obrigatório'),
  lote4: z.string(),
  lote5: z.string(),
  localizacao: locationSchema,
  localizacaoEscritorioCliente: locationSchema,
  localizacaoEscritorioLbr: locationSchema,

  // Cliente - Gestor
  gestorArea: z.string(),
  emailGestor: z.string().email('Email inválido').or(z.literal('')),
  telefoneGestor: z.string(),

  // Cliente - Gerente
  gerenteEngenharia: z.string(),
  emailGerente: z.string().email('Email inválido').or(z.literal('')),
  telefoneGerente: z.string(),

  // Equipe - Coordenadora
  coordenadora: z.string(),
  emailCoordenadora: z.string().email('Email inválido').or(z.literal('')),
  telefoneCoordenadora: z.string(),

  // Equipe - Engenheiro
  engenheiro: z.string(),
  emailEngenheiro: z.string().email('Email inválido').or(z.literal('')),
  telefoneEngenheiro: z.string(),
})

export type ContractFormData = z.infer<typeof contractFormSchema>

// API payload schema
export const contractPayloadSchema = z.object({
  name: z.string(),
  sector: z.string().nullable(),
  object: z.string(),
  scope: z.string(),
  lote4: z.string().nullable(),
  lote5: z.string().nullable(),
  status: z.enum(['Ativo', 'Inativo', 'Pendente']),
  location: z.string().nullable(),
  organization: z.object({
    name: z.string(),
  }),
  participants: z.array(participantSchema),
  obras: z.array(obraSchema),
})

export type ContractPayload = z.infer<typeof contractPayloadSchema>

// Constants
export const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const emptyLocation: LocationValue = {
  texto: '',
  lat: null,
  lng: null,
  placeId: null,
}
