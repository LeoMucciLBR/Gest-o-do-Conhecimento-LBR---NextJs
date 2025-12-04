import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portal | LBR Gestão de Conhecimento',
  description: 'Sistema de Gestão do Conhecimento da LBR Engenharia e Consultoria',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
