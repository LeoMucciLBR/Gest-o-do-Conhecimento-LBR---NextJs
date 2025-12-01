import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// GET /api/contracts/[id]/products/files - List files
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
    const folderId = url.searchParams.get('folder') || null

    // Verificar se contrato existe
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Buscar arquivos
    const files = await prisma.product_files.findMany({
      where: {
        contract_id: contractId,
        folder_id: folderId
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        uploaded_at: 'desc'
      }
    })

    // Convert BigInt to Number for serialization
    const serializedFiles = files.map(file => ({
      ...file,
      file_size: Number(file.file_size)
    }))

    return NextResponse.json({ files: serializedFiles })
  } catch (error: any) {
    console.error('Error fetching product files:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

// POST /api/contracts/[id]/products/files - Upload file
export async function POST(
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

    // Check permissions
    if (session.users.role !== 'ADMIN' && session.users.role !== 'ENGENHEIRO') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: contractId } = await params
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folderId = formData.get('folder_id') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file size (e.g., 50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 })
    }

    // Verify contract exists
    const contract = await prisma.contracts.findUnique({
      where: { id: contractId }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Verify folder exists if provided
    if (folderId) {
      const folder = await prisma.product_folders.findUnique({
        where: { id: folderId }
      })
      if (!folder || folder.contract_id !== contractId) {
        return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
      }
    }

    // Prepare file for saving
    const buffer = Buffer.from(await file.arrayBuffer())
    const timestamp = Date.now()
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFilename = `${timestamp}_${safeFilename}`
    
    // Create directory structure: public/uploads/products/[contractId]
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products', contractId)
    await mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, uniqueFilename)
    const publicUrl = `/uploads/products/${contractId}/${uniqueFilename}`

    // Save file to disk
    await writeFile(filePath, buffer)

    // Determine file type based on extension or mime type
    let fileType = 'DOCUMENT'
    const mime = file.type.toLowerCase()
    if (mime.includes('image')) fileType = 'IMAGE'
    else if (mime.includes('pdf')) fileType = 'PDF'
    else if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('sheet')) fileType = 'SPREADSHEET'
    else if (mime.includes('zip') || mime.includes('compressed') || mime.includes('tar')) fileType = 'ARCHIVE'

    // Create database record
    const savedFile = await prisma.product_files.create({
      data: {
        contract_id: contractId,
        folder_id: folderId || null,
        filename: uniqueFilename,
        original_filename: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        file_type: fileType,
        uploaded_by: session.users.id
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Convert BigInt to Number for serialization
    const serializedFile = {
      ...savedFile,
      file_size: Number(savedFile.file_size)
    }

    return NextResponse.json({ file: serializedFile }, { status: 201 })

  } catch (error: any) {
    console.error('Error uploading product file:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload file' },
      { status: 500 }
    )
  }
}
