import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/services/sessionManager'
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
        ip: request.headers.get('x-forwarded-for') || (request as any).ip || undefined,
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
        ip: request.headers.get('x-forwarded-for') || (request as any).ip || undefined,
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
    const { token: sessionToken } = await createSession({
      userId: user.id,
      ipAddress: request.headers.get('x-forwarded-for') || (request as any).ip || undefined,
      userAgent: request.headers.get('user-agent') ?? undefined
    })

    await auditLogin({
      userId: user.id,
      emailInput: email,
      success: true,
      ip: request.headers.get('x-forwarded-for') || (request as any).ip || undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      provider: 'local',
    })

    const cookieStore = await cookies()
    cookieStore.set('sid', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      // maxAge removido para ser cookie de sessão (expira ao fechar navegador)
    })

    // Load ficha to get area
    const userWithFicha = await prisma.users.findUnique({
      where: { id: user.id },
      include: { ficha: true }
    })

    return NextResponse.json({
      isFirstLogin: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        area: userWithFicha?.ficha?.area ?? undefined,
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
