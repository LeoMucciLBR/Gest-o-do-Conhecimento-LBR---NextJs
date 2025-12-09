import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { prisma } from '@/lib/prisma'

// GET /api/contracts/[id]/measurements/folders - List folders
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: contractId } = await params
    const url = new URL(request.url)
    const parentId = url.searchParams.get('parent') || null

    // Verificar se contrato existe
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Buscar pastas
    const folders = await prisma.measurement_folders.findMany({
      where: {
        contract_id: contractId,
        parent_folder_id: parentId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            sub_folders: true,
            files: true
          }
        }
      },
      orderBy: [
        { folder_order: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ folders })
  } catch (error: any) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

// POST /api/contracts/[id]/measurements/folders - Create folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('POST /api/contracts/[id]/measurements/folders called')
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      console.log('No session token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      console.log('Invalid session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session validated for user:', session.user.email, 'Role:', session.user.role)

    const { id: contractId } = await params
    console.log('Contract ID:', contractId)

    const body = await request.json()
    console.log('Request body:', body)
    const { name, description, parent_folder_id } = body

    // Any authenticated user can create folders
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Verificar se contrato existe
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      console.log('Contract not found')
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    //Verificar se já existe pasta com mesmo nome
    const existing = await prisma.measurement_folders.findFirst({
      where: {
        contract_id: contractId,
        parent_folder_id: parent_folder_id || null,
        name: name.trim()
      }
    })

    if (existing) {
      console.log('Folder already exists')
      return NextResponse.json(
        { error: 'Folder with this name already exists in this location' },
        { status: 409 }
      )
    }

    console.log('Creating folder...')
    // Criar pasta
    const folder = await prisma.measurement_folders.create({
      data: {
        contract_id: contractId,
        parent_folder_id: parent_folder_id || null,
        name: name.trim(),
        description: description || null,
        created_by: session.user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
    console.log('Folder created:', folder.id)

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create folder' },
      { status: 500 }
    )
  }
}
