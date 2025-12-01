import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth/session'

// GET /api/fichas/[id] - Get ficha by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ficha = await prisma.fichas.findUnique({
      where: { id }
    })

    if (!ficha) {
      return NextResponse.json({ error: 'Ficha not found' }, { status: 404 })
    }

    return NextResponse.json(ficha)
  } catch (error: any) {
    console.error('Error fetching ficha:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching ficha' },
      { status: 500 }
    )
  }
}

// PUT /api/fichas/[id] - Update ficha
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      nome,
      email,
      telefone,
      celular,
      cpf,
      rg,
      data_nascimento,
      nacionalidade,
      estado_civil,
      genero,
      endereco,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cep,
      profissao,
      especialidades,
      registro_profissional,
      resumo_profissional,
      idiomas,
      formacoes,
      experiencias,
      certificados,
      foto_perfil_url,
      observacoes
    } = body

    const updatedFicha = await prisma.fichas.update({
      where: { id },
      data: {
        nome,
        email,
        telefone,
        celular,
        cpf,
        rg,
        data_nascimento: data_nascimento ? new Date(data_nascimento) : null,
        nacionalidade,
        estado_civil,
        genero,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        cep,
        profissao,
        especialidades,
        registro_profissional,
        resumo_profissional,
        idiomas,
        formacoes,
        experiencias,
        certificados,
        foto_perfil_url,
        observacoes
      }
    })

    return NextResponse.json(updatedFicha)
  } catch (error: any) {
    console.error('Error updating ficha:', error)
    return NextResponse.json(
      { error: error.message || 'Error updating ficha' },
      { status: 500 }
    )
  }
}

// DELETE /api/fichas/[id] - Delete ficha
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionToken)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if ficha is linked to any user
    const userWithFicha = await prisma.users.findFirst({
      where: { ficha_id: id }
    })

    if (userWithFicha) {
      // Unlink from user first
      await prisma.users.update({
        where: { id: userWithFicha.id },
        data: { ficha_id: null }
      })
    }

    await prisma.fichas.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Ficha deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting ficha:', error)
    return NextResponse.json(
      { error: error.message || 'Error deleting ficha' },
      { status: 500 }
    )
  }
}
