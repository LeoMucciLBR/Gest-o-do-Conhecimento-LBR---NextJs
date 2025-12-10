// Types based on the NestJS DTOs
export type ParticipantRole =
  | 'GESTOR_AREA'
  | 'GERENTE_ENGENHARIA'
  | 'COORDENADORA'
  | 'ENGENHEIRO_RESPONSAVEL'

export type ContractStatus = 'Ativo' | 'Inativo' | 'Pendente'

export type TipoRodovia = 'FEDERAL' | 'ESTADUAL'

export interface OrgDto {
  name: string
}

export interface PersonDto {
  full_name: string
  email?: string | null
  phone?: string | null
  office?: string | null
}

export interface ParticipantDto {
  role: ParticipantRole
  personId?: string
  person?: PersonDto
}

export interface ObraDto {
  tipoRodovia: TipoRodovia
  uf: string
  rodoviaId?: number
  brCodigo?: string
  kmInicio: number
  kmFim: number
}

export interface CreateContractDto {
  name: string
  sector?: string | null
  object: string
  scope: string
  lote4?: string | null
  lote5?: string | null
  status?: ContractStatus
  location?: string | null
  dataInicio?: string | null  // ISO string date
  dataFim?: string | null      // ISO string date
  valor?: string | null
  organizationId?: string | null
  organization?: OrgDto
  participants?: ParticipantDto[]
  obras?: ObraDto[]
}

export interface ListContractsQuery {
  q?: string
  status?: ContractStatus
  page?: number
  pageSize?: number
}
