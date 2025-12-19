import { describe, it, expect } from 'vitest'
import {
  createContractSchema,
  listContractsQuerySchema,
  validateCreateContract,
  participantSchema,
  obraSchema,
} from '../contractValidators'

describe('contractValidators', () => {
  describe('createContractSchema', () => {
    it('should validate a minimal valid contract', () => {
      const result = createContractSchema.safeParse({
        name: 'Contrato Teste',
        organization: { name: 'Empresa XYZ' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject contract without name', () => {
      const result = createContractSchema.safeParse({
        organization: { name: 'Empresa XYZ' },
      })
      expect(result.success).toBe(false)
    })

    it('should reject contract without organization', () => {
      const result = createContractSchema.safeParse({
        name: 'Contrato Teste',
      })
      expect(result.success).toBe(false)
    })

    it('should accept contract with organizationId instead of organization object', () => {
      const result = createContractSchema.safeParse({
        name: 'Contrato Teste',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should validate a complete contract with all fields', () => {
      const result = validateCreateContract({
        name: 'Contrato Completo',
        organization: { name: 'Empresa ABC' },
        sector: 'Engenharia',
        object: 'Construção de rodovia',
        status: 'Ativo',
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        valor: 'R$ 1.000.000,00',
        participants: [
          {
            role: 'GERENTE_PROJETO',
            person: { full_name: 'João Silva', email: 'joao@email.com' },
          },
        ],
        obras: [
          {
            tipoRodovia: 'FEDERAL',
            uf: 'SP',
            brCodigo: '050',
            kmInicio: 100,
            kmFim: 150,
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const result = createContractSchema.safeParse({
        name: 'Contrato',
        organization: { name: 'Empresa' },
        status: 'InvalidStatus',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('participantSchema', () => {
    it('should validate participant with personId', () => {
      const result = participantSchema.safeParse({
        role: 'GERENTE_PROJETO',
        personId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })

    it('should validate participant with person object', () => {
      const result = participantSchema.safeParse({
        role: 'ANALISTA',
        person: { full_name: 'Maria Santos' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject participant without personId or person', () => {
      const result = participantSchema.safeParse({
        role: 'ANALISTA',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const result = participantSchema.safeParse({
        role: 'INVALID_ROLE',
        person: { full_name: 'Test' },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('obraSchema', () => {
    it('should validate federal highway with brCodigo and uf', () => {
      const result = obraSchema.safeParse({
        tipoRodovia: 'FEDERAL',
        uf: 'SP',
        brCodigo: '050',
        kmInicio: 100,
        kmFim: 150,
      })
      expect(result.success).toBe(true)
    })

    it('should validate state highway with rodoviaId', () => {
      const result = obraSchema.safeParse({
        tipoRodovia: 'ESTADUAL',
        rodoviaId: 123,
        kmInicio: 0,
        kmFim: 50,
      })
      expect(result.success).toBe(true)
    })

    it('should validate fixed point with lat/lng', () => {
      const result = obraSchema.safeParse({
        tipoRodovia: 'PONTO_FIXO',
        kmInicio: 0,
        kmFim: 0,
        lat: -23.5505,
        lng: -46.6333,
        nome: 'Ponto em São Paulo',
      })
      expect(result.success).toBe(true)
    })

    it('should reject when kmFim < kmInicio', () => {
      const result = obraSchema.safeParse({
        tipoRodovia: 'ESTADUAL',
        rodoviaId: 123,
        kmInicio: 100,
        kmFim: 50,
      })
      expect(result.success).toBe(false)
    })

    it('should reject federal highway without uf', () => {
      const result = obraSchema.safeParse({
        tipoRodovia: 'FEDERAL',
        brCodigo: '050',
        kmInicio: 0,
        kmFim: 50,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('listContractsQuerySchema', () => {
    it('should use defaults for empty query', () => {
      const result = listContractsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(12)
      }
    })

    it('should coerce string numbers', () => {
      const result = listContractsQuerySchema.safeParse({
        page: '5',
        pageSize: '20',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(5)
        expect(result.data.pageSize).toBe(20)
      }
    })

    it('should reject pageSize > 100', () => {
      const result = listContractsQuerySchema.safeParse({
        pageSize: 500,
      })
      expect(result.success).toBe(false)
    })
  })
})
