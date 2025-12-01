import { Session } from './session'

/**
 * Check if a user has admin role
 */
export function isAdmin(session: Session | null): boolean {
  if (!session || !session.users) return false
  return session.users.role === 'ADMIN'
}

/**
 * Require admin role - throws error if not admin
 * Use in API routes to protect endpoints
 */
export function requireAdmin(session: Session | null): void {
  if (!isAdmin(session)) {
    throw new Error('Unauthorized: Admin access required')
  }
}
