'use client'

import { useParams } from 'next/navigation'
import SoftwareExplorer from './components/SoftwareExplorer'

export default function ContractSoftwarePage() {
  const params = useParams()
  const contractId = params.id as string

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <SoftwareExplorer contractId={contractId} />
    </div>
  )
}
