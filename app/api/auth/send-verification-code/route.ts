import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  generateVerificationCode,
  sendVerificationCode,
} from '@/lib/services/emailService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    // Verificar se usuário existe
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        user_passwords: {
          select: {
            is_first_login: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar se é realmente primeiro login
    if (!user.user_passwords?.is_first_login) {
      return NextResponse.json(
        { error: 'Esta ação é apenas para primeiro acesso' },
        { status: 400 }
      )
    }

    // Gerar código de 6 dígitos
    const code = generateVerificationCode()

    // Calcular expiração (10 minutos)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Criar hash do código para armazenar
    const crypto = await import('crypto')
    const tokenHash = crypto.createHash('sha256').update(code).digest()

    // Salvar código no banco (usando tabela email_verifications)
    await prisma.email_verifications.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    })

    // Enviar email
    const emailSent = await sendVerificationCode(user.email, code, user.name || undefined)

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Erro ao enviar email. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Código enviado para seu email',
      expiresIn: 600, // 10 minutos em segundos
    })
  } catch (error) {
    console.error('Send verification code error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
