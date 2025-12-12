import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

// GET /api/admin/suppliers - List all suppliers
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    const suppliers = await prisma.suppliers.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { cnpj: { contains: search } }
        ]
      } : undefined,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ suppliers })
  } catch (error: any) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, email, phone, cnpj } = body

    if (!name || !cnpj) {
      return NextResponse.json({ error: 'Nome e CNPJ são obrigatórios' }, { status: 400 })
    }

    // Basic CNPJ validation (format check)
    const cleanCnpj = cnpj.replace(/\D/g, '')
    if (cleanCnpj.length !== 14) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 })
    }

    const supplier = await prisma.suppliers.create({
      data: {
        name,
        email: email || '',
        phone: phone || null,
        cnpj: cleanCnpj
      }
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
       return NextResponse.json({ error: 'Fornecedor já cadastrado (CNPJ duplicado)' }, { status: 409 })
    }
    console.error('Error creating supplier:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
