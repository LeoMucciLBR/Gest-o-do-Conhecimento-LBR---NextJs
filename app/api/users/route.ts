import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/middleware'
import { hashPassword } from '@/lib/auth/password'
import { nanoid } from 'nanoid'

// GET /api/users - List all users
export async function GET(request: NextRequest) {
  // Check authentication
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        picture_url: true,
        role: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create new user with ficha
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, area } = body

    // Validação básica
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 8 caracteres' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    // Hash da senha
    const passwordHash = await hashPassword(password)

    // Criar usuário e ficha em uma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar ficha primeiro
      const fichaId = nanoid()
      const ficha = await tx.fichas.create({
        data: {
          id: fichaId,
          nome: name,
          email: email.toLowerCase().trim(),
          area: area || null,
          tipo: 'INTERNA',
        }
      })

      // 2. Criar usuário vinculado à ficha
      const user = await tx.users.create({
        data: {
          email: email.toLowerCase().trim(),
          name: name,
          role: role || 'user',
          ficha_id: ficha.id,
          is_active: true,
        }
      })

      // 3. Criar senha do usuário
      await tx.user_passwords.create({
        data: {
          user_id: user.id,
          password_hash: passwordHash,
          is_first_login: true, // Força mudança de senha no primeiro login
        }
      })

      return { user, ficha }
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        area: result.ficha.area,
      },
      message: 'Usuário criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('User creation error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}
