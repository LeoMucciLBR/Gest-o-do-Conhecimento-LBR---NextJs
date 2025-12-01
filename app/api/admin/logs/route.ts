import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getLogs } from '@/lib/services/loginLogger'

export async function GET(request: NextRequest) {
  try {
    // TODO: Adicionar verificação de permissão de admin aqui
    // const session = await getSession(request)
    // if (session.user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const searchParams = request.nextUrl.searchParams
    const page = Number(searchParams.get('page') || '1')
    const limit = Number(searchParams.get('limit') || '50')
    const userId = searchParams.get('userId') || undefined
    const email = searchParams.get('email') || undefined
    const success = searchParams.get('success') 
      ? searchParams.get('success') === 'true' 
      : undefined

    const offset = (page - 1) * limit

    // Se tiver email, buscar ID do usuário primeiro
    let filterUserId = userId
    if (email && !userId) {
      const user = await prisma.users.findUnique({ where: { email } })
      if (user) filterUserId = user.id
    }

    const { logs, total } = await getLogs({
      userId: filterUserId,
      success,
      limit,
      offset,
    })

    const serializedLogs = logs.map(log => ({
      ...log,
      id: log.id.toString(),
    }))

    return NextResponse.json({
      logs: serializedLogs,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
        limit,
      }
    })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar logs' },
      { status: 500 }
    )
  }
}
