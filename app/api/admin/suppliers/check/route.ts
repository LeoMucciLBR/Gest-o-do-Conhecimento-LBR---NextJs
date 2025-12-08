import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const supplier = await prisma.suppliers.findFirst({
      where: { user_id: userId }
    })

    return NextResponse.json({ exists: !!supplier, supplier })
  } catch (error: any) {
    console.error('Error checking supplier:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
