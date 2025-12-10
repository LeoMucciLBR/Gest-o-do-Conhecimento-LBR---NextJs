'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SessionsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to audit page with sessions tab active
    router.push('/admin/audit')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecionando para Auditoria...</p>
      </div>
    </div>
  )
}
