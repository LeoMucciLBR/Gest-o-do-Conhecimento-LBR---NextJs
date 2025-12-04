import ContractDetailsClient from './ContractDetailsClient'

export default async function ContractDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  return <ContractDetailsClient contractId={id} />
}
