import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()
    const code = body?.code?.trim()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se o código tem 6 dígitos
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Código inválido. Deve conter 6 dígitos.' },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Criar hash do código fornecido
    const crypto = await import('crypto')
    const tokenHash = crypto.createHash('sha256').update(code).digest()

    // Buscar verificação válida
    const verification = await prisma.email_verifications.findFirst({
      where: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: { gt: new Date() }, // Não expirou
        used_at: null, // Não foi usado
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    if (!verification) {
      return NextResponse.json(
        { error: 'Código inválido ou expirado' },
        { status: 401 }
      )
    }

    // Marcar código como usado
    await prisma.email_verifications.update({
      where: { id: verification.id },
      data: { used_at: new Date() },
    })

    // Retornar token de verificação único (para usar na troca de senha)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    
    // Armazenar token temporário (expira em 15 minutos)
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)
    
    const tokenHashForPassword = crypto.createHash('sha256').update(verificationToken).digest()
    
    await prisma.password_resets.create({
      data: {
        user_id: user.id,
        token_hash: tokenHashForPassword,
        expires_at: expiresAt,
      },
    })

    return NextResponse.json({
      message: 'Código verificado com sucesso',
      verificationToken, // Cliente usará isso na troca de senha
    })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
