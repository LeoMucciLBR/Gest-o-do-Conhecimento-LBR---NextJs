import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'
import type { CreateContractDto, ListContractsQuery } from '@/lib/types/contracts'
import { logContractCreation } from '@/lib/services/auditLogger'
import { createContractNotifications } from '@/lib/services/contractNotifications'
import { logger } from '@/lib/logger'

// Valid contract role values from Prisma enum
const VALID_CONTRACT_ROLES = [
  'GESTOR_AREA',
  'GERENTE_ENGENHARIA', 
  'COORDENADORA',
  'ENGENHEIRO_RESPONSAVEL',
  'GERENTE_PROJETO',
  'ANALISTA',
  'OUTRO'
] as const

// Helper to map any string to a valid contract_role enum value
function mapToContractRole(role: string | undefined | null): string {
  if (!role) return 'OUTRO'
  
  const normalized = role.toUpperCase().trim()
  
  // Check if it matches a valid enum value
  if (VALID_CONTRACT_ROLES.includes(normalized as any)) {
    return normalized
  }
  
  // Map common variations
  const mappings: Record<string, string> = {
    'GESTOR': 'GESTOR_AREA',
    'GERENTE': 'GERENTE_PROJETO',
    'COORDENADOR': 'COORDENADORA',
    'ENGENHEIRO': 'ENGENHEIRO_RESPONSAVEL',
  }
  
  if (mappings[normalized]) {
    return mappings[normalized]
  }
  
  // Default to OUTRO for any custom text
  return 'OUTRO'
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const dto: CreateContractDto = await request.json()

    logger.debug('CREATE /contracts payload', { dto })

    const contract = await prisma.$transaction(async (tx) => {
      // 1) Organization: get by ID or create/recycle by name (case-insensitive)
      let orgId = dto.organizationId ?? null

      if (!orgId && dto.organization?.name) {
        const normalized = dto.organization.name.trim()
        const existing = await tx.organizations.findFirst({
          where: { name: { equals: normalized, mode: 'insensitive' } },
          select: { id: true },
        })
        orgId = existing
          ? existing.id
          : (
              await tx.organizations.create({
                data: { name: normalized },
                select: { id: true },
              })
            ).id
      }

      if (!orgId) {
        throw new Error('organizationId ou organization.name é obrigatório')
      }

      // 2) Contract
      const contract = await tx.contracts.create({
        data: {
          organization_id: orgId,
          name: dto.name,
          sector: dto.sector ?? null,
          object: dto.object ?? null,
          scope: dto.scope ?? null,

          status: (dto.status as any) ?? 'Ativo',
          location: dto.location ?? null,
          data_inicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
          data_fim: dto.dataFim ? new Date(dto.dataFim) : null,
          valor: dto.valor ?? null,
          created_by: authResult.user.id, // Adicionar criador do contrato
        },
      })

      // 3) Participants
      if (dto.participants?.length) {
        for (const p of dto.participants) {
          let personId = p.personId ?? null

          if (!personId && p.person?.full_name?.trim()) {
            const full_name = p.person.full_name.trim()
            let found: { id: string } | null = null

            if (p.person.email?.trim()) {
              found = await tx.people.findFirst({
                where: {
                  email: { equals: p.person.email.trim(), mode: 'insensitive' },
                },
                select: { id: true },
              })
            }

            if (!found) {
              found = await tx.people.findFirst({
                where: {
                  full_name: { equals: full_name, mode: 'insensitive' },
                  organization_id: orgId,
                },
                select: { id: true },
              })
            }

            if (found) {
              personId = found.id
              await tx.people.update({
                where: { id: personId },
                data: {
                  email: p.person.email ?? undefined,
                  phone: p.person.phone ?? undefined,
                  office: p.person.office ?? undefined,
                },
              })
            } else {
              personId = (
                await tx.people.create({
                  data: {
                    organization_id: orgId,
                    full_name,
                    email: p.person.email ?? null,
                    phone: p.person.phone ?? null,
                    office: p.person.office ?? null,
                  },
                  select: { id: true },
                })
              ).id
            }
          }

          if (!personId) continue

          // Determine if role is custom (will be mapped to OUTRO)
          const mappedRole = mapToContractRole(p.role)
          const isCustomRole = (mappedRole as string) === 'OUTRO' && p.role && (p.role as string) !== 'OUTRO'
          
          await tx.contract_participants.create({
            data: {
              contract_id: contract.id,
              person_id: personId,
              role: mappedRole as any,
              custom_role: isCustomRole ? p.role : null,
            },
          })
        }
      }

      // 4) Obras linked to contract
      if (dto.obras?.length) {
        logger.debug('Processing obras', { obras: dto.obras })
        
        // For FEDERAL highways, we need to find the rodovia_id from the rodovias table
        const obrasToCreate = []
        
        for (const obra of dto.obras) {
          // Handle PONTO_FIXO (fixed location with lat/lng)
          if ((obra as any).tipoRodovia === 'PONTO_FIXO' && (obra as any).lat && (obra as any).lng) {
            // Create obra with geometry using raw SQL
            const lat = (obra as any).lat
            const lng = (obra as any).lng
            const nome = (obra as any).nome || 'Ponto Fixo'
            
            logger.debug('Creating fixed point obra', { nome, lat, lng })
            
            await tx.$executeRaw`
              INSERT INTO obras (contract_id, nome, km_inicio, km_fim, status, geometria)
              VALUES (
                ${contract.id}::uuid,
                ${nome},
                0,
                0,
                'Planejado',
                ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)
              )
            `
            logger.debug('Created fixed point obra', { nome })
            continue
          }
          
          let rodoviaidToUse = null
          
          if (obra.tipoRodovia === 'FEDERAL' && obra.brCodigo && obra.uf) {
            // Find rodovia by codigo format: "BR-050"
            const codigo = `BR-${obra.brCodigo}`
            logger.debug('Searching for federal highway', { codigo, tipo: 'FEDERAL', uf: obra.uf })
            
            const rodovia = await tx.rodovias.findFirst({
              where: {
                codigo: codigo,
                tipo: 'FEDERAL',
                uf: obra.uf,
              },
              select: { id: true, nome: true, codigo: true },
            })
            
            logger.debug('Highway search result', { rodovia })
            
            if (rodovia) {
              rodoviaidToUse = rodovia.id
              logger.debug('Found federal highway', { brCodigo: obra.brCodigo, uf: obra.uf, id: rodovia.id, nome: rodovia.nome })
            } else {
              // Try to find any federal highway in this UF to help debug
              const allFederalInUf = await tx.rodovias.findMany({
                where: {
                  uf: obra.uf,
                  tipo: 'FEDERAL',
                },
                select: { codigo: true, nome: true },
                take: 5,
              })
              logger.warn('Federal highway not found', { brCodigo: obra.brCodigo, uf: obra.uf, codigo, availableHighways: allFederalInUf })
              continue // Skip this obra
            }
          } else if (obra.tipoRodovia === 'ESTADUAL' && obra.rodoviaId) {
            // Use rodoviaId directly for ESTADUAL
            rodoviaidToUse = Number(obra.rodoviaId)
          } else {
            logger.warn('Invalid obra configuration', { obra })
            continue // Skip invalid obras
          }
          
          if (rodoviaidToUse) {
            obrasToCreate.push({
              contract_id: contract.id,
              rodovia_id: rodoviaidToUse,
              nome:
                obra.tipoRodovia === 'FEDERAL' && obra.brCodigo
                  ? `BR-${obra.brCodigo}`
                  : '',
              descricao: `Trecho ${obra.kmInicio} - ${obra.kmFim} (${obra.tipoRodovia})`,
              km_inicio: new Prisma.Decimal(obra.kmInicio),
              km_fim: new Prisma.Decimal(obra.kmFim),
              status: 'Planejado',
            })
          }
        }

        logger.debug('Obras to create', { count: obrasToCreate.length, obrasToCreate })
        
        if (obrasToCreate.length) {
          await tx.obras.createMany({ data: obrasToCreate })
          logger.debug('Created obras', { count: obrasToCreate.length })
        } else {
          logger.warn('No valid obras to create')
        }
      }

      // 5) Handle laminaFile upload
      logger.debug('Checking laminaFile', { 
        hasLaminaFile: !!(dto as any).laminaFile,
        laminaFileKeys: (dto as any).laminaFile ? Object.keys((dto as any).laminaFile) : null
      })
      
      if ((dto as any).laminaFile) {
        const { filename, contentType, data } = (dto as any).laminaFile
        
        logger.debug('Processing laminaFile', { filename, contentType, dataLength: data?.length })
        
        // Store as data URI (data URL includes the base64 prefix)
        const storageUrl = data.startsWith('data:') ? data : `data:${contentType || 'application/pdf'};base64,${data}`

        await tx.contract_documents.create({
          data: {
            contract_id: contract.id,
            filename: filename || 'lamina.pdf',
            content_type: contentType || 'application/pdf',
            storage_url: storageUrl,
            kind: 'LAMINA',
          },
        })
        
        logger.debug('Lamina document created successfully')
      } else {
        logger.debug('No laminaFile in payload')
      }

      // 6) Handle coverImageFile upload
      logger.debug('Checking coverImageFile', { 
        hasCoverImageFile: !!(dto as any).coverImageFile,
        coverImageFileKeys: (dto as any).coverImageFile ? Object.keys((dto as any).coverImageFile) : null
      })
      
      if ((dto as any).coverImageFile) {
        const { filename, contentType, data } = (dto as any).coverImageFile
        
        logger.debug('Processing coverImageFile', { filename, contentType, dataLength: data?.length })
        
        // Store as data URI (data URL includes the base64 prefix)
        const storageUrl = data.startsWith('data:') ? data : `data:${contentType || 'image/jpeg'};base64,${data}`

        await tx.contract_documents.create({
          data: {
            contract_id: contract.id,
            filename: filename || 'cover.jpg',
            content_type: contentType || 'image/jpeg',
            storage_url: storageUrl,
            kind: 'COVER_IMAGE',
          },
        })
        
        logger.debug('Cover image document created successfully')
      } else {
        logger.debug('No coverImageFile in payload')
      }

      // 7) Handle company participations
      logger.debug('Checking companyParticipations', {
        hasCompanyParticipations: !!(dto as any).companyParticipations,
        participationsLength: (dto as any).companyParticipations?.length || 0
      })

      if ((dto as any).companyParticipations?.length) {
        const participations = (dto as any).companyParticipations

        for (const cp of participations) {
          // Try to find matching empresa by name (using safe tagged template)
          const empresa = await tx.$queryRaw<{ id: string }[]>`
            SELECT id FROM empresas WHERE nome = ${cp.companyName} AND tipo = 'SOCIO' LIMIT 1
          `
          
          const empresaId = empresa?.[0]?.id || null

          await tx.$executeRaw`
            INSERT INTO contract_company_participation (contract_id, company_name, participation_percentage, empresa_id)
            VALUES (${contract.id}::uuid, ${cp.companyName}, ${cp.participationPercentage}::decimal, ${empresaId}::uuid)
          `
        }

        logger.debug('Created company participations', { count: participations.length })
      }

      return contract
    })

    // Registrar log de auditoria
    await logContractCreation(
      contract.id,
      authResult.user.id,
      {
        name: dto.name,
        organization: dto.organization?.name || dto.organizationId,
        status: dto.status || 'Ativo'
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    )

    // Criar notificações para todos os usuários
    await createContractNotifications(contract.id, authResult.user.id, 'CREATE')

    return NextResponse.json(contract, { status: 201 })
  } catch (error: any) {
    logger.error('Contract creation error', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar contrato' },
      { status: 400 }
    )
  }
}

// GET /api/contracts - List contracts
export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 12)))

    const where: any = {
      is_deleted: false // Filtrar contratos não deletados
    }
    if (status) where.status = status as any
    if (q?.trim()) {
      const term = q.trim()
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { object: { contains: term, mode: 'insensitive' } },
        { sector: { contains: term, mode: 'insensitive' } },
      ]
    }

    const [total, items] = await prisma.$transaction([
      prisma.contracts.count({ where }),
      prisma.contracts.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // Enrich with organizations
    const orgIds = Array.from(
      new Set(
        items.map((i) => i.organization_id).filter((v): v is string => !!v)
      )
    )
    const orgs = orgIds.length
      ? await prisma.organizations.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true },
        })
      : []
    const orgMap = new Map(orgs.map((o) => [o.id, o]))

    // Fetch documents for all contracts
    const contractIds = items.map((i) => i.id)
    const allDocuments = contractIds.length
      ? await prisma.contract_documents.findMany({
          where: { contract_id: { in: contractIds } },
          select: { contract_id: true, kind: true, storage_url: true },
        })
      : []
    
    // Create map of contract_id -> documents
    const docsMap = new Map<string, any[]>()
    for (const doc of allDocuments) {
      if (!docsMap.has(doc.contract_id)) {
        docsMap.set(doc.contract_id, [])
      }
      docsMap.get(doc.contract_id)!.push(doc)
    }

    // Fetch creators for all contracts
    const creatorIds = Array.from(
      new Set(
        items.map((i) => i.created_by).filter((v): v is string => !!v)
      )
    )
    const creators = creatorIds.length
      ? await prisma.users.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, name: true, email: true },
        })
      : []
    const creatorsMap = new Map(creators.map((c) => [c.id, c]))

    const enriched = items.map((i) => {
      const docs = docsMap.get(i.id) || []
      const coverImage = docs.find((d) => d.kind === 'COVER_IMAGE')
      const lamina = docs.find((d) => d.kind === 'LAMINA')
      const creator = i.created_by ? creatorsMap.get(i.created_by) : null
      
      return {
        ...i,
        organization: i.organization_id
          ? (orgMap.get(i.organization_id) ?? null)
          : null,
        creator: creator || null,
        image_url: coverImage?.storage_url || null,
        lamina_url: lamina?.storage_url || null,
      }
    })

    return NextResponse.json({ total, page, pageSize, items: enriched })
  } catch (error) {
    logger.error('List contracts error', error)
    return NextResponse.json(
      { error: 'Erro ao listar contratos' },
      { status: 500 }
    )
  }
}
