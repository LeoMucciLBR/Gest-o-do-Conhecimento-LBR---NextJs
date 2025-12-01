import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

// PUT /api/contracts/[contractId]/measurements/files/[fileId] - Update file (move)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
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

    if (session.users.role !== 'ADMIN' && session.users.role !== 'ENGENHEIRO') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { fileId } = await params
    const body = await request.json()
    const { folder_id } = body

    // Buscar arquivo
    const file = await prisma.measurement_files.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Atualizar arquivo
    const updated = await prisma.measurement_files.update({
      where: { id: fileId },
      data: {
        folder_id: folder_id || null // null se for para a raiz
      }
    })

    // Converter BigInt para Number
    const serializedFile = {
      ...updated,
      file_size: Number(updated.file_size)
    }

    return NextResponse.json({ file: serializedFile })
  } catch (error: any) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update file' },
      { status: 500 }
    )
  }
}

// DELETE /api/contracts/[contractId]/measurements/files/[fileId] - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
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

    if (session.users.role !== 'ADMIN' && session.users.role !== 'ENGENHEIRO') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: contractId, fileId } = await params

    // Buscar arquivo
    const file = await prisma.measurement_files.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Remover do disco
    try {
      // O caminho salvo no banco é relativo a public (ex: /uploads/measurements/...)
      // Precisamos do caminho absoluto do sistema
      const absolutePath = path.join(process.cwd(), 'public', file.file_path)
      await unlink(absolutePath)
    } catch (error: any) {
      console.error('Error deleting file from disk:', error)
      // Continuar para deletar do banco mesmo se falhar no disco (arquivo pode não existir mais)
    }

    // Deletar do banco
    await prisma.measurement_files.delete({
      where: { id: fileId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete file' },
      { status: 500 }
    )
  }
}
