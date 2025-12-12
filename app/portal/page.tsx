import AnimatedBackground from '@/components/ui/AnimatedBackground'
import CardNav from '@/components/ui/CardNav'
import Image from 'next/image'
import ThemeToggle from '@/components/theme/ThemeToggle'

export default function Portal() {
  return (
    <div className="min-h-dvh relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Animated background */}
      <AnimatedBackground />

      {/* conteúdo acima do fundo */}
      <div className="relative z-10 grid place-items-center px-4 py-10">
        <div className="w-full max-w-6xl text-center">
          {/* Logo Azul (Light Mode) */}
          <Image
            src="/images/Logo.png"
            alt="lbr engenharia e consultoria"
            width={200}
            height={96}
            className="mx-auto h-16 md:h-20 lg:h-24 w-auto mb-4 block dark:hidden"
          />
          {/* Logo Branca (Dark Mode) */}
          <Image
            src="/images/LogoBranca.png"
            alt="lbr engenharia e consultoria"
            width={200}
            height={96}
            className="mx-auto h-16 md:h-20 lg:h-24 w-auto mb-4 hidden dark:block"
          />

          {/* Título */}
          <h1
            className="text-[#2f4982] dark:text-white font-extrabold leading-tight 
                       text-[28px] sm:text-[40px] md:text-[56px]"
          >
            Sistema de Gestão do Conhecimento
          </h1>

          <div
            className={[
              'mt-10 flex flex-wrap justify-center gap-6',
              'hover:[&>*:not(:hover)]:blur-[2px] hover:[&>*:not(:hover)]:scale-95 transition',
            ].join(' ')}
          >
            <CardNav
              title="Comercial"
              to="/comercial/orgaos-publicos"
              image="/images/ImgDepComercial.png"
              items={[
                { label: 'Órgãos Públicos', to: '/comercial/orgaos-publicos' },
                {
                  label: 'Privados / Concessionárias',
                  to: '/comercial/privconcessionaria',
                },
                { label: 'Propostas', to: '/comercial/propostas' },
                { label: 'Finalizadas', to: '/comercial/finalizadas' },
              ]}
            />

            <CardNav
              title="Engenharia"
              to="/engenharia/contratos"
              image="/images/ImgDepEngenharia.png"
              items={[
                { label: 'Contratos', to: '/engenharia/contratos' },
                { label: 'Cadastro de Contratos', to: '/engenharia/cadastrocontratos' },
                { label: 'Equipe', to: '/engenharia/equipe' },
              ]}
            />

            <CardNav
              title="Financeiro"
              to="/financeiro/visao-geral"
              image="/images/imgDepFinanceiro.jpg"
              items={[
                { label: 'Visão Geral', to: '/financeiro/visao-geral' },
                { label: 'Contas a Pagar', to: '/financeiro/pagar' },
                { label: 'Contas a Receber', to: '/financeiro/receber' },
              ]}
            />

            <CardNav
              title="Cadastros"
              to="/cadastros"
              image="/images/ImgDepEngenharia.png"
              items={[
                { label: 'Empresas', to: '/cadastros?tab=empresas' },
                { label: 'Clientes', to: '/cadastros?tab=clientes' },
                { label: 'Equipe', to: '/cadastros?tab=equipe' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
