import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/services/sessionManager'
import { auditLogin } from '@/lib/auth/audit'
import { cookies } from 'next/headers'
import { getRealIp, getUserAgent } from '@/lib/security/requestUtils'
import { isIpBlocked, isIpWhitelisted } from '@/lib/security/ipBlocker'
import { isUserBlocked, blockUser as autoBlockUser } from '@/lib/security/emailBlocker'
import { checkLoginAttempts, recordLoginAttempt } from '@/lib/security/rateLimiter'
import { isFromBrazil, getLocationFromIp } from '@/lib/security/geoip'

export async function POST(request: NextRequest) {
  const ipAddress = getRealIp(request)
  const userAgent = getUserAgent(request)
  
  try {
    const body = await request.json()
    const email = body?.email?.trim()?.toLowerCase()
    const password = body?.password ?? ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // ============================================
    // SECURITY CHECK 1: IP Bloqueado?
    // ============================================
    const ipBlocked = await isIpBlocked(ipAddress)
    if (ipBlocked) {
      await recordLoginAttempt(email, ipAddress, false, {
        userAgent,
        errorReason: 'IP_BLOCKED',
      })

      return NextResponse.json(
        { 
          error: 'Acesso bloqueado',
          message: 'Seu endereço IP foi bloqueado pelo administrador. Entre em contato com o suporte.',
          code: 'IP_BLOCKED'
        },
        { status: 403 }
      )
    }

    // ============================================
    // SECURITY CHECK 2: IP Whitelisted (bypass)
    // ============================================
    const ipWhitelisted = await isIpWhitelisted(ipAddress)

    // ============================================
    // SECURITY CHECK 3: Brasil Only (com exceções)
    // ============================================
    if (!ipWhitelisted) {
      const location = await getLocationFromIp(ipAddress)
      const fromBrazil = await isFromBrazil(ipAddress)

      if (!fromBrazil) {
        // Verificar se usuário tem permissão para acesso internacional
        const user = await prisma.users.findUnique({
          where: { email },
          select: { allow_international_access: true }
        })

        if (!user?.allow_international_access) {
          await recordLoginAttempt(email, ipAddress, false, {
            country: location.country,
            city: location.city,
            userAgent,
            errorReason: 'COUNTRY_BLOCKED',
          })

          return NextResponse.json(
            { 
              error: 'Acesso negado',
              message: 'Acesso permitido apenas do Brasil. Se você precisa acessar de outro país, contate o administrador.',
              code: 'COUNTRY_BLOCKED',
              country: location.country
            },
            { status: 403 }
          )
        }
      }
    }

    // ============================================
    // SECURITY CHECK 4: Rate Limiting
    // ============================================
    const rateLimitResult = await checkLoginAttempts(email, ipAddress)
    
    if (!rateLimitResult.allowed) {
      if (rateLimitResult.permanentlyBlocked) {
        // Usuário foi bloqueado automaticamente após 5 tentativas
        return NextResponse.json(
          { 
            error: 'Conta bloqueada',
            message: 'Sua conta foi bloqueada após múltiplas tentativas de login. Entre em contato com o administrador do sistema.',
            code: 'USER_BLOCKED',
            attemptsLeft: 0
          },
          { status: 403 }
        )
      }

      // Cooldown de 15 minutos
      const minutesLeft = rateLimitResult.cooldownUntil 
        ? Math.ceil((rateLimitResult.cooldownUntil.getTime() - Date.now()) / 60000)
        : 15

      return NextResponse.json(
        { 
          error: 'Muitas tentativas',
          message: `Você excedeu o número de tentativas permitidas. Tente novamente em ${minutesLeft} minutos.`,
          code: 'RATE_LIMIT',
          cooldownUntil: rateLimitResult.cooldownUntil,
          attemptsLeft: 0
        },
        { status: 429 }
      )
    }

    // ============================================
    // SECURITY CHECK 5: Usuário Bloqueado?
    // ============================================
    const userBlocked = await isUserBlocked(email)
    if (userBlocked) {
      await recordLoginAttempt(email, ipAddress, false, {
        userAgent,
        errorReason: 'USER_BLOCKED',
      })

      return NextResponse.json(
        { 
          error: 'Conta bloqueada',
          message: 'Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte para mais informações.',
          code: 'USER_BLOCKED'
        },
        { status: 403 }
      )
    }

    // ============================================
    // CREDENTIAL VALIDATION
    // ============================================
    const user = await prisma.users.findUnique({ where: { email } })
    const userPassword = user
      ? await prisma.user_passwords.findUnique({
          where: { user_id: user.id },
        })
      : null

    const isValid = userPassword
      ? await verifyPassword(userPassword.password_hash, password)
      : false

    // ============================================
    // LOGIN FAILED - Record & Check Auto-Block
    // ============================================
    if (!isValid || !user) {
      const location = await getLocationFromIp(ipAddress)
      
      await recordLoginAttempt(email, ipAddress, false, {
        country: location.country,
        city: location.city,
        userAgent,
        errorReason: 'INVALID_CREDENTIALS',
      })

      // Verificar se deve bloquear automaticamente após essa tentativa
      const newRateLimitResult = await checkLoginAttempts(email, ipAddress)
      
      if (newRateLimitResult.permanentlyBlocked) {
        // TODO: Enviar email para admin notificando bloqueio automático
        console.log(`[SECURITY] User ${email} automatically blocked after 5 failed attempts`)
      }

      // Audit log
      await auditLogin({
        userId: user?.id,
        emailInput: email,
        success: false,
        reason: 'USER_OR_PASS',
        ip: ipAddress,
        userAgent,
        provider: 'local',
      })

      return NextResponse.json(
        { 
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos.',
          attemptsLeft: newRateLimitResult.attemptsLeft
        },
        { status: 401 }
      )
    }

    // ============================================
    // LOGIN SUCCESSFUL
    // ============================================
    const location = await getLocationFromIp(ipAddress)
    
    // Registrar tentativa bem-sucedida
    await recordLoginAttempt(email, ipAddress, true, {
      country: location.country,
      city: location.city,
      userAgent,
    })

    // Atualizar dados de último login do usuário
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_login_ip: ipAddress,
        last_login_country: location.country,
      }
    })

    // Verificar se é primeiro login
    const isFirstLogin = userPassword?.is_first_login ?? false

    if (isFirstLogin) {
      await auditLogin({
        userId: user.id,
        emailInput: email,
        success: true,
        ip: ipAddress,
        userAgent,
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

    // TODO: Fase 4 - Detecção de anomalias
    // Verificar se IP/país é diferente do usual
    // Criar security_alert se necessário

    // Criar sessão
    const { token: sessionToken } = await createSession({
      userId: user.id,
      ipAddress,
      userAgent
    })

    await auditLogin({
      userId: user.id,
      emailInput: email,
      success: true,
      ip: ipAddress,
      userAgent,
      provider: 'local',
    })

    const cookieStore = await cookies()
    cookieStore.set('sid', sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })

    // Load ficha para retornar área
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
    
    // Registrar erro no sistema
    try {
      await recordLoginAttempt(
        (await request.json())?.email || 'unknown',
        ipAddress,
        false,
        { userAgent, errorReason: 'SYSTEM_ERROR' }
      )
    } catch {}

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
