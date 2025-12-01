import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import { validatePasswordStrength } from '@/lib/utils/passwordValidator'
import { logLogin } from '@/lib/services/loginLogger'
import { createSession } from '@/lib/services/sessionManager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()
    const verificationToken = body?.verificationToken?.trim()
    const newPassword = body?.newPassword

    if (!email || !verificationToken || !newPassword) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar força da senha
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Senha fraca',
          details: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    // Verificar token de verificação
    const crypto = await import('crypto')
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest()

    const passwordReset = await prisma.password_resets.findFirst({
      where: {
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: { gt: new Date() },
        used_at: null,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    if (!passwordReset) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    // Hash da nova senha usando Argon2
    const passwordHash = await hashPassword(newPassword)

    // Atualizar senha e marcar is_first_login = false
    await prisma.user_passwords.upsert({
      where: { user_id: user.id },
      update: {
        password_hash: passwordHash,
        password_updated_at: new Date(),
        is_first_login: false,
        must_change: false,
      },
      create: {
        user_id: user.id,
        password_hash: passwordHash,
        is_first_login: false,
      },
    })

    // Marcar token como usado
    await prisma.password_resets.update({
      where: { id: passwordReset.id },
      data: { used_at: new Date() },
    })

    // Registrar log
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await logLogin({
      userId: user.id,
      email: user.email,
      action: 'PASSWORD_CHANGE',
      success: true,
      ipAddress,
      userAgent,
    })

    // Criar sessão automaticamente
    const { session, token } = await createSession({
      userId: user.id,
      userAgent,
      ipAddress,
    })

    // Retornar success com sessão
    return NextResponse.json({
      message: 'Senha alterada com sucesso',
      sessionToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
