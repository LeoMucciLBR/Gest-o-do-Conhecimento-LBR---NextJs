import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { Prisma } from '@prisma/client'
import { canDeleteContract, canEditContract } from '@/lib/auth/contractAuth'
import { logContractDeletion, logContractUpdate } from '@/lib/services/auditLogger'

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

    const c = await prisma.contracts.findUnique({ where: { id } })
    if (!c) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      )
    }

    const org = c.organization_id
      ? await prisma.organizations.findUnique({
          where: { id: c.organization_id },
        })
      : null

    const participants = await prisma.contract_participants.findMany({
      where: { contract_id: id },
      select: { role: true, person_id: true },
    })

    type PersonLite = {
      id: string
      full_name: string
      email: string | null
      phone: string | null
      office: string | null
      organization_id: string | null
    }

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

    const documents = await prisma.contract_documents.findMany({
      where: { contract_id: id },
      orderBy: { created_at: 'desc' },
    })

    // Fetch obras with geometries
    const obrasRaw = await prisma.obras.findMany({
      where: { contract_id: id },
      select: {
        id: true,
        nome: true,
        km_inicio: true,
        km_fim: true,
        rodovia_id: true,
      },
    })

    // Fetch rodovias info to get UF and geometria
    const rodoviasIds = obrasRaw.map((o) => o.rodovia_id)
    const rodovias = rodoviasIds.length
      ? await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, uf, nome, codigo, ST_AsGeoJSON(geometria) as geometria FROM rodovias WHERE id = ANY($1)`,
          rodoviasIds
        )
      : []

    const rodoviasMap = new Map(rodovias.map((r) => [r.id, r]))

    // Combine obras with rodovia data and fetch geometry using advanced PostGIS query
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
          // Ensure 3 digits for BR code (e.g. "050")
          if (br_codigo.length < 3) {
             br_codigo = br_codigo.padStart(3, '0')
          }
          rodovia_nome = rodovia.codigo // Use codigo (e.g. "BR-050") for the query
        }
      }

      // Calculate geometry using the complex PostGIS query provided by the user
      let geometria = null
      
      if (rodovia && obra.km_inicio !== null && obra.km_fim !== null) {
        try {
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
          
          // Debug: Count how many segments match the criteria
          const debugQuery = `
            SELECT COUNT(*) as segment_count
            FROM segmento_rodovia s
            JOIN rodovias r ON r.codigo = s.rodovia_codigo
            WHERE r.uf = $1
              AND (r.nome = $2 OR r.codigo = $2 OR r.nome LIKE $2 || '/%')
              AND s.km_final >= $3
              AND s.km_inicial <= $4
          `
          
          const debugResult: any[] = await prisma.$queryRawUnsafe(
            debugQuery,
            rodovia.uf,
            rodovia_nome,
            Number(obra.km_inicio),
            Number(obra.km_fim)
          )
          
          console.log(`🔍 Obra ${obra.id}: Found ${debugResult[0]?.segment_count || 0} matching segments for ${rodovia_nome} KM ${obra.km_inicio}-${obra.km_fim}`)
          
          // Debug: Show sample segment data for federal highways
          if (tipo_rodovia === 'FEDERAL' && debugResult[0]?.segment_count > 5) {
            const sampleQuery = `
              SELECT s.km_inicial, s.km_final, s.rodovia_codigo
              FROM segmento_rodovia s
              JOIN rodovias r ON r.codigo = s.rodovia_codigo
              WHERE r.uf = $1
                AND (r.nome = $2 OR r.codigo = $2 OR r.nome LIKE $2 || '/%')
              LIMIT 5
            `
            const sampleResult: any[] = await prisma.$queryRawUnsafe(
              sampleQuery,
              rodovia.uf,
              rodovia_nome
            )
            console.log(`📊 Sample segments for ${rodovia_nome}:`, sampleResult.map(s => ({
              codigo: s.rodovia_codigo,
              km_inicial: s.km_inicial?.toString() || 'NULL',
              km_final: s.km_final?.toString() || 'NULL'
            })))
          }
          
          const result: any[] = await prisma.$queryRawUnsafe(
            query, 
            rodovia.uf, 
            rodovia_nome, 
            Number(obra.km_inicio), 
            Number(obra.km_fim)
          )
          
          if (result && result.length > 0 && result[0].geojson) {
             // The query returns a FeatureCollection, but our map expects a single Feature or Geometry
             // Extract the geometry from the FeatureCollection
             const featureCollection = result[0].geojson
             if (featureCollection.features && featureCollection.features.length > 0) {
                geometria = featureCollection.features[0].geometry
                console.log(`✅ Obra ${obra.id}: PostGIS query returned geometry`, {
                  type: geometria?.type,
                  hasCoordinates: !!geometria?.coordinates,
                  coordinatesLength: geometria?.coordinates?.length
                })
             } else {
                console.warn(`⚠️ Obra ${obra.id}: PostGIS query returned empty FeatureCollection`)
             }
          } else {
            console.warn(`⚠️ Obra ${obra.id}: PostGIS query returned no results`)
          }
          
          console.log(`Calculated geometry for Obra ${obra.id}:`, {
             found: !!geometria,
             params: { uf: rodovia.uf, rodovia: rodovia_nome, km_ini: Number(obra.km_inicio), km_fim: Number(obra.km_fim) },
             willUseFallback: !geometria && !!rodovia.geometria
          })
          
        } catch (err) {
          console.error(`Error calculating geometry for Obra ${obra.id}:`, err)
        }
        
        
        // FALLBACK: If segmento_rodovia is empty, use approximation for geometry
        if (!geometria && rodovia.geometria) {
          try {
            if (tipo_rodovia === 'FEDERAL') {
              // For federal highways, try to approximate the segment using total highway length
              console.warn(`⚠️ Obra ${obra.id}: Using approximation for federal highway (no detailed segment data)`)
              
              // Get the total KM range of the highway
              const totalKmInicio = 0 // Federal highways typically start at KM 0
              const totalKmFim = 1000 // Conservative estimate - will adjust based on geometry if possible
              
              // Calculate approximate percentages for ST_LineSubstring
              const obraKmInicio = Number(obra.km_inicio)
              const obraKmFim = Number(obra.km_fim)
              
              const startFraction = Math.max(0, Math.min(1, obraKmInicio / totalKmFim))
              const endFraction = Math.max(0, Math.min(1, obraKmFim / totalKmFim))
              
              console.log(`Approximating federal highway segment: KM ${obraKmInicio}-${obraKmFim}, fraction: ${startFraction}-${endFraction}`)
              
              // Try to use PostGIS to cut the line
              try {
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
                
                if (cutResult && cutResult.length > 0 && cutResult[0].geojson) {
                  geometria = JSON.parse(cutResult[0].geojson)
                  console.log(`✅ Obra ${obra.id}: Approximated federal highway geometry`)
                }
              } catch (cutErr) {
                console.error(`Error cutting federal highway geometry:`, cutErr)
                // Fall back to full geometry if cutting fails
                const parsedGeometry = typeof rodovia.geometria === 'string' 
                  ? JSON.parse(rodovia.geometria) 
                  : rodovia.geometria
                geometria = parsedGeometry
                console.log(`⚠️ Obra ${obra.id}: Using full federal highway geometry (approximation failed)`)
              }
              
            } else {
              // For state highways, use full geometry as fallback
              console.warn(`⚠️ Obra ${obra.id}: segmento_rodovia empty, using fallback (full highway geometry)`)
              
              const parsedGeometry = typeof rodovia.geometria === 'string' 
                ? JSON.parse(rodovia.geometria) 
                : rodovia.geometria
              
              geometria = parsedGeometry
              console.log(`✅ Obra ${obra.id}: Fallback geometry loaded (type: ${geometria?.type})`)
            }
          } catch (fallbackErr) {
            console.error(`Error loading fallback geometry for Obra ${obra.id}:`, fallbackErr)
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

    const participantsWithPerson = participants.map((p) => ({
      role: p.role,
      person: people.find((pp) => pp.id === p.person_id) ?? null,
    }))

    return NextResponse.json({
      contract: c,
      organization: org,
      participants: participantsWithPerson,
      documents,
      obras,
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
        },
      })

      // 4) Update Participants - Delete existing and recreate
      await tx.contract_participants.deleteMany({
        where: { contract_id: id },
      })

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
              contract_id: id,
              person_id: personId,
              role: mapToContractRole(p.role) as any,
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

