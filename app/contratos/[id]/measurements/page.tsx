import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MeasurementExplorer from './components/MeasurementExplorer'

export default async function MeasurementsPage({ params }: { params: { id: string } }) {
  const contract = await prisma.contracts.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true
    }
  })

  if (!contract) {
    notFound()
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    }>
      <MeasurementExplorer 
        contractId={contract.id} 
        contractName={contract.name} 
      />
    </Suspense>
  )
}
