import Background from '@/components/background/Background'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import CardNav from '@/components/ui/CardNav'
import Image from 'next/image'

export default function Portal() {
  return (
    <div className="min-h-dvh">
      {/* Animated background */}
      <AnimatedBackground />
      {/* fundo global atrás do conteúdo */}
      <Background overlay="dark" />

      {/* conteúdo acima do fundo */}
      <div className="relative z-10 grid place-items-center px-4 py-10">
        <div className="w-full max-w-6xl text-center">
          <Image
            src="/images/LogoBranca.png"
            alt="lbr engenharia e consultoria"
            width={200}
            height={96}
            className="mx-auto h-16 md:h-20 lg:h-24 w-auto mb-4"
            priority
          />

          {/* Título */}
          <h1
            className="text-[#ffffff] font-extrabold leading-tight 
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
              to="/engenharia"
              image="/images/ImgDepEngenharia.png"
              items={[
                { label: 'Contratos', to: '/engenharia/contratos' },
                { label: 'Cadastro de Contratos', to: '/engenharia/cadastrocontratos' },
                { label: 'Equipe', to: '/engenharia/equipe' },
              ]}
            />

            <CardNav
              title="Financeiro"
              to="/financeiro"
              image="/images/imgDepFinanceiro.jpg"
              items={[
                { label: 'Visão Geral', to: '/financeiro/visao-geral' },
                { label: 'Contas a Pagar', to: '/financeiro/pagar' },
                { label: 'Contas a Receber', to: '/financeiro/receber' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
