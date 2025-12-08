import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'
import type { CreateContractDto, ListContractsQuery } from '@/lib/types/contracts'

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

console.log('CREATE /contracts payload =', JSON.stringify(dto))

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

          await tx.contract_participants.create({
            data: {
              contract_id: contract.id,
              person_id: personId,
              role: mapToContractRole(p.role) as any,
              custom_role: p.role, // Save the original text
            },
          })
        }
      }

      // 4) Obras linked to contract
      if (dto.obras?.length) {
        console.log('Processing obras:', dto.obras)
        
        // For FEDERAL highways, we need to find the rodovia_id from the rodovias table
        const obrasToCreate = []
        
        for (const obra of dto.obras) {
          let rodoviaidToUse = null
          
          if (obra.tipoRodovia === 'FEDERAL' && obra.brCodigo && obra.uf) {
            // Find rodovia by codigo format: "BR-050"
            const codigo = `BR-${obra.brCodigo}`
            console.log(`🔍 Searching for federal highway with codigo: "${codigo}", tipo: FEDERAL, uf: ${obra.uf}`)
            
            const rodovia = await tx.rodovias.findFirst({
              where: {
                codigo: codigo,
                tipo: 'FEDERAL',
                uf: obra.uf,
              },
              select: { id: true, nome: true, codigo: true },
            })
            
            console.log(`🔍 Search result:`, rodovia)
            
            if (rodovia) {
              rodoviaidToUse = rodovia.id
              console.log(`✅ Found federal highway BR-${obra.brCodigo} in ${obra.uf}: ID ${rodovia.id}, nome: ${rodovia.nome}`)
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
              console.log(`⚠️ Federal highway BR-${obra.brCodigo} not found in ${obra.uf} (looking for codigo: ${codigo})`)
              console.log(`   Available federal highways in ${obra.uf}:`, allFederalInUf.map(r => `${r.codigo} (${r.nome})`).join(', '))
              continue // Skip this obra
            }
          } else if (obra.tipoRodovia === 'ESTADUAL' && obra.rodoviaId) {
            // Use rodoviaId directly for ESTADUAL
            rodoviaidToUse = Number(obra.rodoviaId)
          } else {
            console.log('⚠️ Invalid obra configuration:', obra)
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

        console.log('Obras to create:', obrasToCreate)
        
        if (obrasToCreate.length) {
          await tx.obras.createMany({ data: obrasToCreate })
          console.log(`✅ Created ${obrasToCreate.length} obras`)
        } else {
          console.log('⚠️ No valid obras to create')
        }
      }

      // 5) Handle laminaFile upload
      console.log('Checking laminaFile:', { 
        hasLaminaFile: !!(dto as any).laminaFile,
        laminaFileKeys: (dto as any).laminaFile ? Object.keys((dto as any).laminaFile) : null
      })
      
      if ((dto as any).laminaFile) {
        const { filename, contentType, data } = (dto as any).laminaFile
        
        console.log('Processing laminaFile:', { filename, contentType, dataLength: data?.length })
        
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
        
        console.log('✅ Lamina document created successfully')
      } else {
        console.log('⚠️ No laminaFile in payload')
      }

      // 6) Handle coverImageFile upload
      console.log('Checking coverImageFile:', { 
        hasCoverImageFile: !!(dto as any).coverImageFile,
        coverImageFileKeys: (dto as any).coverImageFile ? Object.keys((dto as any).coverImageFile) : null
      })
      
      if ((dto as any).coverImageFile) {
        const { filename, contentType, data } = (dto as any).coverImageFile
        
        console.log('Processing coverImageFile:', { filename, contentType, dataLength: data?.length })
        
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
        
        console.log('✅ Cover image document created successfully')
      } else {
        console.log('⚠️ No coverImageFile in payload')
      }

      return contract
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error: any) {
    console.error('Contract creation error:', error)
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

    const where: any = {}
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

    const enriched = items.map((i) => {
      const docs = docsMap.get(i.id) || []
      const coverImage = docs.find((d) => d.kind === 'COVER_IMAGE')
      const lamina = docs.find((d) => d.kind === 'LAMINA')
      
      return {
        ...i,
        organization: i.organization_id
          ? (orgMap.get(i.organization_id) ?? null)
          : null,
        image_url: coverImage?.storage_url || null,
        lamina_url: lamina?.storage_url || null,
      }
    })

    return NextResponse.json({ total, page, pageSize, items: enriched })
  } catch (error) {
    console.error('List contracts error:', error)
    return NextResponse.json(
      { error: 'Erro ao listar contratos' },
      { status: 500 }
    )
  }
}
