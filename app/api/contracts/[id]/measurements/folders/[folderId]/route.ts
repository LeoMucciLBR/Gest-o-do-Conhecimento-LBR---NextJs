import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'
import { prisma } from '@/lib/prisma'

// PUT /api/contracts/[contractId]/measurements/folders/[folderId] - Update folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string }> }
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'ENGENHEIRO') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { folderId } = await params
    const body = await request.json()
    const { name, description } = body

    // Buscar pasta
    const folder = await prisma.measurement_folders.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Se alterando nome, verificar duplicatas
    if (name && name !== folder.name) {
      const existing = await prisma.measurement_folders.findFirst({
        where: {
          contract_id: folder.contract_id,
          parent_folder_id: folder.parent_folder_id,
          name: name.trim(),
          id: { not: folderId }
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Folder with this name already exists in this location' },
          { status: 409 }
        )
      }
    }

    // Atualizar pasta
    const updated = await prisma.measurement_folders.update({
      where: { id: folderId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description })
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

    return NextResponse.json({ folder: updated })
  } catch (error: any) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update folder' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts/[contractId]/measurements/folders/[folderId] - Delete folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string }> }
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

    if (session.user.role !== 'ADMIN' && session.user.role !== 'ENGENHEIRO') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { folderId } = await params

    // Buscar pasta
    const folder = await prisma.measurement_folders.findUnique({
      where: { id: folderId },
      include: {
        _count: {
          select: {
            sub_folders: true,
            files: true
          }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Verificar se pasta está vazia
    const url = new URL(request.url)
    const force = url.searchParams.get('force') === 'true'

    if (!force && (folder._count.sub_folders > 0 || folder._count.files > 0)) {
      return NextResponse.json(
        { error: 'Folder is not empty. Use force=true to delete with contents.' },
        { status: 400 }
      )
    }

    // Deletar pasta (cascade vai deletar subpastas e arquivos)
    await prisma.measurement_folders.delete({
      where: { id: folderId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
