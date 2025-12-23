import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'
import { canDeleteContract, canEditContract } from '@/lib/auth/contractAuth'
import { logContractDeletion, logContractUpdate } from '@/lib/services/auditLogger'
import { createContractNotifications } from '@/lib/services/contractNotifications'

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

// GET /api/contracts/[id] - Get single contract with details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const startTime = Date.now()
    console.log(`⏱️ [${id}] START loading contract`)

    // First query: get contract (needed to check if exists and get organization_id)
    const c = await prisma.contracts.findUnique({ where: { id } })
    console.log(`⏱️ [${id}] Contract query: ${Date.now() - startTime}ms`)
    
    if (!c) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    const parallelStart = Date.now()
    // OPTIMIZATION: Run independent queries in parallel
    const [org, participants, documents, obrasRaw, companyParticipations] = await Promise.all([
      // Organization
      c.organization_id
        ? prisma.organizations.findUnique({ where: { id: c.organization_id } })
        : Promise.resolve(null),
      
      // Participants
      prisma.contract_participants.findMany({
        where: { contract_id: id },
        select: { role: true, custom_role: true, person_id: true },
      }),
      
      // Documents
      prisma.contract_documents.findMany({
        where: { contract_id: id },
        orderBy: { created_at: 'desc' },
      }),
      
      // Obras
      prisma.obras.findMany({
        where: { contract_id: id },
        select: {
          id: true,
          nome: true,
          km_inicio: true,
          km_fim: true,
          rodovia_id: true,
        },
      }),
      
      // Company participations
      prisma.$queryRawUnsafe<any[]>(`
        SELECT id, company_name, participation_percentage, empresa_id, created_at, updated_at
        FROM contract_company_participation
        WHERE contract_id = $1::uuid
        ORDER BY created_at
      `, id),
    ])
    console.log(`⏱️ [${id}] Parallel queries: ${Date.now() - parallelStart}ms (${obrasRaw.length} obras)`)

    type PersonLite = {
      id: string
      full_name: string
      email: string | null
      phone: string | null
      office: string | null
      organization_id: string | null
    }

    // Fetch people (depends on participants result)
    const peopleStart = Date.now()
    let people: PersonLite[] = []
    if (participants.length) {
      const ids = participants.map((p) => p.person_id)
      people = await prisma.people.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          office: true,
          organization_id: true,
        },
      })
    }
    console.log(`⏱️ [${id}] People query: ${Date.now() - peopleStart}ms`)

    // Fetch rodovias info in batch (depends on obras result)
    const rodoviasStart = Date.now()
    const rodoviasIds = obrasRaw.map((o) => o.rodovia_id).filter(Boolean)
    const rodovias = rodoviasIds.length
      ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, uf, nome, codigo, ST_AsGeoJSON(geometria) as geometria FROM rodovias WHERE id = ANY($1)`,
          rodoviasIds
        )
      : []
    console.log(`⏱️ [${id}] Rodovias query: ${Date.now() - rodoviasStart}ms`)

    const rodoviasMap = new Map(rodovias.map((r) => [r.id, r]))
    
    const geometryStart = Date.now()

    // Process obras with geometry (optimized - removed debug queries)
    const obras = await Promise.all(obrasRaw.map(async (obra) => {
      const rodovia = rodoviasMap.get(obra.rodovia_id)
      
      // Determine type and code
      let tipo_rodovia = 'ESTADUAL'
      let br_codigo = null
      let rodovia_nome = rodovia?.nome || ''
      
      if (rodovia) {
        const isNumeric = /^\d+$/.test(rodovia.nome)
        if (isNumeric || rodovia.nome.startsWith('BR-')) {
          tipo_rodovia = 'FEDERAL'
          br_codigo = rodovia.nome.replace('BR-', '').replace(/\/.*$/, '')
          if (br_codigo.length < 3) {
             br_codigo = br_codigo.padStart(3, '0')
          }
          rodovia_nome = rodovia.codigo
        }
      }

      let geometria = null
      
      if (rodovia && obra.km_inicio !== null && obra.km_fim !== null) {
        try {
          // Main PostGIS query for geometry calculation
          const query = `
            WITH params AS (
              SELECT
                $1::text      AS p_uf,
                $2::text      AS p_rodovia,
                $3::numeric   AS p_km_ini,
                $4::numeric   AS p_km_fim
            ),
            segmentos AS (
              SELECT
                s.id,
                s.geom,
                s.km_inicial,
                s.km_final,
                (s.km_final - s.km_inicial) AS total_km,
                GREATEST(p.p_km_ini, s.km_inicial) AS km_rec_ini,
                LEAST(p.p_km_fim, s.km_final)      AS km_rec_fim,
                r.nome AS rodovia,
                r.uf
              FROM segmento_rodovia s
              JOIN rodovias r ON r.codigo = s.rodovia_codigo
              CROSS JOIN params p
              WHERE r.uf   = p.p_uf
                AND (
                  r.nome = p.p_rodovia 
                  OR r.codigo = p.p_rodovia
                  OR r.nome LIKE p.p_rodovia || '/%'
                )
                AND s.km_final   >= p.p_km_ini
                AND s.km_inicial <= p.p_km_fim
            ),
            recortes AS (
              SELECT
                ST_LineSubstring(
                  ST_LineMerge(geom::geography::geometry),
                  (km_rec_ini - km_inicial) / NULLIF(total_km,0)::float,
                  (km_rec_fim - km_inicial) / NULLIF(total_km,0)::float
                ) AS geom_recortado,
                rodovia,
                uf
              FROM segmentos
              WHERE total_km   > 0
                AND km_rec_fim > km_rec_ini
            ),
            unido AS (
              SELECT
                CASE 
                  WHEN ST_SRID(ST_Union(geom_recortado)) = 4326 
                  THEN ST_Union(geom_recortado)
                  ELSE ST_Transform(ST_Union(geom_recortado), 4326)
                END AS geom_unido,
                MIN(uf)      AS uf,
                MIN(rodovia) AS rodovia
              FROM recortes
            )
            SELECT jsonb_build_object(
              'type', 'FeatureCollection',
              'features', jsonb_build_array(
                jsonb_build_object(
                  'type', 'Feature',
                  'geometry', ST_AsGeoJSON(geom_unido)::jsonb,
                  'properties', jsonb_build_object(
                    'uf',        (SELECT p_uf      FROM params),
                    'rodovia',   (SELECT p_rodovia FROM params),
                    'km_inicial',(SELECT p_km_ini  FROM params),
                    'km_final',  (SELECT p_km_fim  FROM params)
                  )
                )
              )
            ) AS geojson
            FROM unido;
          `
          
          const result: any[] = await prisma.$queryRawUnsafe(
            query, 
            rodovia.uf, 
            rodovia_nome, 
            Number(obra.km_inicio), 
            Number(obra.km_fim)
          )
          
          if (result?.[0]?.geojson?.features?.[0]?.geometry) {
            geometria = result[0].geojson.features[0].geometry
          }
        } catch {
          // Silent fail - will try fallback
        }
        
        // FALLBACK: Use approximation if main query fails
        if (!geometria && rodovia.geometria) {
          try {
            if (tipo_rodovia === 'FEDERAL') {
              const obraKmInicio = Number(obra.km_inicio)
              const obraKmFim = Number(obra.km_fim)
              const totalKmFim = 1000
              
              const startFraction = Math.max(0, Math.min(1, obraKmInicio / totalKmFim))
              const endFraction = Math.max(0, Math.min(1, obraKmFim / totalKmFim))
              
              const cutQuery = `
                SELECT ST_AsGeoJSON(
                  ST_LineSubstring(
                    geometria::geography::geometry,
                    $1::float,
                    $2::float
                  )
                ) as geojson
                FROM rodovias
                WHERE id = $3
              `
              
              const cutResult: any[] = await prisma.$queryRawUnsafe(
                cutQuery,
                startFraction,
                endFraction,
                obra.rodovia_id
              )
              
              if (cutResult?.[0]?.geojson) {
                geometria = JSON.parse(cutResult[0].geojson)
              }
            }
            
            // Final fallback: use full geometry
            if (!geometria) {
              geometria = typeof rodovia.geometria === 'string' 
                ? JSON.parse(rodovia.geometria) 
                : rodovia.geometria
            }
          } catch {
            // Silent fail
          }
        }
      }

      return {
        id: obra.id,
        nome: rodovia?.nome || obra.nome || `${tipo_rodovia === 'FEDERAL' ? 'BR-' + br_codigo : 'Rodovia não identificada'}`,
        km_inicio: Number(obra.km_inicio),
        km_fim: Number(obra.km_fim),
        rodovia_id: obra.rodovia_id,
        uf: rodovia?.uf || null,
        geometria,
        tipo_rodovia,
        br_codigo,
      }
    }))
    console.log(`⏱️ [${id}] Geometry loop: ${Date.now() - geometryStart}ms`)

    const participantsWithPerson = participants.map((p) => ({
      role: p.role,
      custom_role: p.custom_role,
      person: people.find((pp) => pp.id === p.person_id) ?? null,
    }))

    // Extract lamina_url and image_url from documents
    const laminaDoc = documents.find(d => d.kind === 'LAMINA')
    const coverDoc = documents.find(d => d.kind === 'COVER_IMAGE')
    
    const lamina_url = laminaDoc?.storage_url || null
    const image_url = coverDoc?.storage_url || null

    console.log(`⏱️ [${id}] TOTAL: ${Date.now() - startTime}ms`)

    return NextResponse.json({
      contract: {
        ...c,
        lamina_url,
        image_url,
      },
      organization: org,
      participants: participantsWithPerson,
      documents,
      obras,
      companyParticipations: companyParticipations || [],
    })
  } catch (error) {
    console.error('Get contract error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar contrato' },
      { status: 500 }
    )
  }
}

// PUT /api/contracts/[id] - Update existing contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const dto: any = await request.json()

    console.log('UPDATE /contracts/[id] payload =', JSON.stringify(dto))

    // Declare changes object outside transaction so it's accessible for audit log
    const changes: Record<string, any> = {}

    const contract = await prisma.$transaction(async (tx) => {
      // 1) Check if contract exists
      const existing = await tx.contracts.findUnique({ where: { id } })
      if (!existing) {
        throw new Error('Contrato não encontrado')
      }

      // 2) Check if user has permission to edit
      const hasPermission = await canEditContract(
        authResult.user.id,
        authResult.user.role || 'user',
        id
      )

      if (!hasPermission) {
        throw new Error('Você não tem permissão para editar este contrato. Apenas o criador, editores autorizados ou administradores podem editar.')
      }

      // 3) Capture changes for audit log
      if (dto.name !== undefined && dto.name !== existing.name) {
        changes.name = { from: existing.name, to: dto.name }
      }
      if (dto.sector !== undefined && dto.sector !== existing.sector) {
        changes.sector = { from: existing.sector, to: dto.sector }
      }
      if (dto.object !== undefined && dto.object !== existing.object) {
        changes.object = { from: existing.object, to: dto.object }
      }
      if (dto.status !== undefined && dto.status !== existing.status) {
        changes.status = { from: existing.status, to: dto.status }
      }
      if (dto.valor !== undefined && dto.valor !== existing.valor) {
        changes.valor = { from: existing.valor, to: dto.valor }
      }

      // 4) Organization: get by ID or create/recycle by name (case-insensitive)
      let orgId = dto.organizationId ?? null

      if (!orgId && dto.organization?.name) {
        const normalized = dto.organization.name.trim()
        const existingOrg = await tx.organizations.findFirst({
          where: { name: { equals: normalized, mode: 'insensitive' } },
          select: { id: true },
        })
        orgId = existingOrg
          ? existingOrg.id
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

      // 3) Update Contract
      const updatedContract = await tx.contracts.update({
        where: { id },
        data: {
          organization: {
            connect: { id: orgId }
          },
          name: dto.name,
          sector: dto.sector ?? null,
          object: dto.object ?? null,
          scope: dto.scope ?? null,
          caracteristicas: dto.caracteristicas ?? null,
          status: (dto.status as any) ?? 'Ativo',
          location: dto.location ?? null,
          client_office_location: dto.clientOfficeLocation ?? null,
          lbr_office_location: dto.lbrOfficeLocation ?? null,
          data_inicio: dto.dataInicio ? new Date(dto.dataInicio) : null,
          data_fim: dto.dataFim ? new Date(dto.dataFim) : null,
          valor: dto.valor ?? null,
        },
      })

      // 4) Update Participants - Delete existing and recreate
      await tx.contract_participants.deleteMany({
        where: { contract_id: id },
      })

      if (dto.participants?.length) {
        for (const p of dto.participants) {
          let personId: string | null = null

          // If personId is provided, verify it exists in people table
          if (p.personId) {
            const existingPerson = await tx.people.findUnique({
              where: { id: p.personId },
              select: { id: true }
            })
            if (existingPerson) {
              personId = existingPerson.id
              // Update person data if provided
              if (p.person) {
                await tx.people.update({
                  where: { id: personId },
                  data: {
                    email: p.person.email ?? undefined,
                    phone: p.person.phone ?? undefined,
                    office: p.person.office ?? undefined,
                  },
                })
              }
            }
          }

          // If personId not found or not provided, search by name/email
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
          const isCustomRole = mappedRole === 'OUTRO' && p.role && p.role !== 'OUTRO'
          
          await tx.contract_participants.create({
            data: {
              contract_id: id,
              person_id: personId,
              role: mappedRole as any,
              custom_role: isCustomRole ? p.role : null,
            },
          })
        }
      }

      // 5) Update Obras - Delete existing and recreate
      await tx.obras.deleteMany({
        where: { contract_id: id },
      })

      if (dto.obras?.length) {
        console.log('Processing obras for update:', dto.obras)
        
        // For FEDERAL highways, we need to find the rodovia_id from the rodovias table
        const obrasToCreate = []
        
        for (const obra of dto.obras) {
          // Handle PONTO_FIXO (fixed location with lat/lng)
          if ((obra as any).tipoRodovia === 'PONTO_FIXO' && (obra as any).lat && (obra as any).lng) {
            // Create obra with geometry using raw SQL
            const lat = (obra as any).lat
            const lng = (obra as any).lng
            const nome = (obra as any).nome || 'Ponto Fixo'
            
            console.log(`📍 Creating fixed point obra: ${nome} at (${lat}, ${lng})`)
            
            await tx.$executeRaw`
              INSERT INTO obras (contract_id, nome, km_inicio, km_fim, status, geometria)
              VALUES (
                ${id}::uuid,
                ${nome},
                0,
                0,
                'Planejado',
                ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)
              )
            `
            console.log(`✅ Created fixed point obra: ${nome}`)
            continue
          }
          
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
              contract_id: id,
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

        console.log('Obras to create on update:', obrasToCreate)
        
        if (obrasToCreate.length) {
          await tx.obras.createMany({ data: obrasToCreate })
          console.log(`✅ Updated ${obrasToCreate.length} obras`)
        } else {
          console.log('⚠️ No valid obras to create on update')
        }
      }

      // 6) Handle laminaFile upload - delete old and create new ONLY if replacing or explicitly removing
      const shouldRemoveLamina = (dto as any).removeLamina === true
      const hasNewLamina = !!(dto as any).laminaFile

      if (shouldRemoveLamina || hasNewLamina) {
        // Delete existing LAMINA documents
        await tx.contract_documents.deleteMany({
          where: {
            contract_id: id,
            kind: 'LAMINA',
          },
        })
      }

      if (hasNewLamina) {
        const { filename, contentType, data } = (dto as any).laminaFile
        
        // Store as data URI (data URL includes the base64 prefix)
        const storageUrl = data.startsWith('data:') ? data : `data:${contentType || 'application/pdf'};base64,${data}`

        await tx.contract_documents.create({
          data: {
            contract_id: id,
            filename: filename || 'lamina.pdf',
            content_type: contentType || 'application/pdf',
            storage_url: storageUrl,
            kind: 'LAMINA',
          },
        })
      }

      // 7) Handle coverImageFile upload - delete old and create new ONLY if replacing or explicitly removing
      const shouldRemoveCover = (dto as any).removeCoverImage === true
      const hasNewCover = !!(dto as any).coverImageFile

      if (shouldRemoveCover || hasNewCover) {
        // Delete existing COVER_IMAGE documents
        await tx.contract_documents.deleteMany({
          where: {
            contract_id: id,
            kind: 'COVER_IMAGE',
          },
        })
      }

      if (hasNewCover) {
        const { filename, contentType, data } = (dto as any).coverImageFile
        
        // Store as data URI (data URL includes the base64 prefix)
        const storageUrl = data.startsWith('data:') ? data : `data:${contentType || 'image/jpeg'};base64,${data}`

        await tx.contract_documents.create({
          data: {
            contract_id: id,
            filename: filename || 'cover.jpg',
            content_type: contentType || 'image/jpeg',
            storage_url: storageUrl,
            kind: 'COVER_IMAGE',
          },
        })
      }

      // 8) Handle company participations - delete existing and recreate
      await tx.$executeRaw`
        DELETE FROM contract_company_participation WHERE contract_id = ${id}::uuid
      `

      if ((dto as any).companyParticipations?.length) {
        const participations = (dto as any).companyParticipations

        for (const cp of participations) {
          // Try to find matching empresa by name
          const empresa = await tx.$queryRawUnsafe<any[]>(`
            SELECT id FROM empresas WHERE nome = $1 AND tipo = 'SOCIO' LIMIT 1
          `, cp.companyName)
          
          const empresaId = empresa?.[0]?.id || null

          await tx.$executeRaw`
            INSERT INTO contract_company_participation (contract_id, company_name, participation_percentage, empresa_id)
            VALUES (${id}::uuid, ${cp.companyName}, ${cp.participationPercentage}::decimal, ${empresaId}::uuid)
          `
        }

        console.log(`✅ Updated ${participations.length} company participations`)
      }

      return updatedContract
    })

    // Log the update - only log if there are changes
    if (Object.keys(changes).length > 0) {
      // Transform changes to before/after format
      const before: Record<string, any> = {}
      const after: Record<string, any> = {}
      
      for (const [key, value] of Object.entries(changes)) {
        if (value && typeof value === 'object' && 'from' in value && 'to' in value) {
          before[key] = value.from
          after[key] = value.to
        }
      }

      await logContractUpdate(
        id,
        authResult.user.id,
        { before, after },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      )

      // Criar notificações para criador e editores (exceto quem alterou)
      await createContractNotifications(id, authResult.user.id, 'UPDATE')
    }

    return NextResponse.json(contract, { status: 200 })
  } catch (error: any) {
    console.error('Contract update error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar contrato' },
      { status: 400 }
    )
  }
}

// DELETE /api/contracts/[id] - Soft delete by setting is_deleted to true
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    // Check if contract exists
    const existing = await prisma.contracts.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    // Check if already deleted
    if (existing.is_deleted) {
      return NextResponse.json(
        { error: 'Contrato já foi deletado' },
        { status: 400 }
      )
    }

    // Check if user has permission to delete
    const hasPermission = await canDeleteContract(
      authResult.user.id,
      authResult.user.role || 'user',
      id
    )

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Você não tem permissão para deletar este contrato. Apenas o criador ou administradores podem deletar.' },
        { status: 403 }
      )
    }

    // Soft delete: set is_deleted to true
    const updated = await prisma.contracts.update({
      where: { id },
      data: { is_deleted: true },
    })

    // Log the deletion
    await logContractDeletion(
      id,
      authResult.user.id,
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json(
      { message: 'Contrato deletado com sucesso', contract: updated },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Contract delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao deletar contrato' },
      { status: 400 }
    )
  }
}

