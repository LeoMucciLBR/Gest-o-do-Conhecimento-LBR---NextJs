/**
 * Check if a user has admin role
 */
export function isAdmin(session: { user?: { role: string } | null } | null): boolean {
  if (!session || !session.user) return false
  return session.user.role?.toUpperCase() === 'ADMIN'
}

/**
 * Require admin role - throws error if not admin
 * Use in API routes to protect endpoints
 */
export function requireAdmin(session: { user?: { role: string } | null } | null): void {
  if (!isAdmin(session)) {
    throw new Error('Unauthorized: Admin access required')
  }
}
