import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'
import { auditLogin } from '@/lib/auth/audit'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = body?.email?.trim()
    const password = body?.password ?? ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Buscar usuário e senha
    const user = await prisma.users.findUnique({ where: { email } })
    const userPassword = user
      ? await prisma.user_passwords.findUnique({
          where: { user_id: user.id },
        })
      : null

    const isValid = userPassword
      ? await verifyPassword(userPassword.password_hash, password)
      : false

    if (!isValid || !user) {
      await auditLogin({
        userId: user?.id,
        emailInput: email,
        success: false,
        reason: 'USER_OR_PASS',
        ip: request.ip,
        userAgent: request.headers.get('user-agent') ?? undefined,
        provider: 'local',
      })

      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar se é primeiro login
    const isFirstLogin = userPassword?.is_first_login ?? false

    if (isFirstLogin) {
      // Para primeiro login, não criar sessão ainda
      // Cliente deve solicitar código de verificação
      await auditLogin({
        userId: user.id,
        emailInput: email,
        success: true,
        ip: request.ip,
        userAgent: request.headers.get('user-agent') ?? undefined,
        provider: 'local',
      })

      return NextResponse.json({
        isFirstLogin: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        },
        message: 'Primeiro acesso detectado. Um código será enviado para seu email.',
      })
    }

    // Login normal - criar sessão
    const sessionToken = await createSession(
      user.id,
      request.ip,
      request.headers.get('user-agent') ?? undefined
    )

    await auditLogin({
      userId: user.id,
      emailInput: email,
      success: true,
      ip: request.ip,
      userAgent: request.headers.get('user-agent') ?? undefined,
      provider: 'local',
    })

    const cookieStore = await cookies()
    cookieStore.set('sid', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: Number(process.env.SESSION_TTL_DAYS ?? '7') * 24 * 60 * 60,
    })

    return NextResponse.json({
      isFirstLogin: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        photoUrl: user.picture_url ?? undefined,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
