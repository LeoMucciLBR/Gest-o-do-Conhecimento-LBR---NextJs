'use server'

import { cookies } from 'next/headers'
import { validateSession } from '@/lib/services/sessionManager'

export interface SessionUser {
  id: string
  email: string
  role: string
  name?: string
}

export interface Session {
  user: SessionUser
}

// Get current session from cookie using existing sessionManager
export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('sid')?.value

    if (!sessionToken) return null

    const result = await validateSession(sessionToken)

    if (!result) return null

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        name: result.user.name ?? undefined
      }
    }
  } catch (error) {
    console.error('Session error:', error)
    return null
  }
}

// Check if user has one of the required roles
export async function isAuthorized(allowedRoles: string[]): Promise<boolean> {
  const session = await getSession()
  if (!session?.user) return false
  
  return allowedRoles.includes(session.user.role)
}
