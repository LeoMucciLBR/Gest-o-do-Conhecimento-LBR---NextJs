import Background from "@/components/background/Background";
import Image from "next/image";
import CardNav from "@/components/ui/CardNav";

export default function Portal() {
  return (
    <div className="min-h-screen">
      {/* fundo global atrás do conteúdo */}
      <Background overlay="dark" />

      {/* conteúdo acima do fundo */}
      <div className="relative z-10 grid place-items-center px-4 py-10">
        <div className="w-full max-w-6xl text-center">
          <Image
            src="/images/LogoBranca.png"
            alt="lbr engenharia e consultoria"
            width={200}
            height={80}
            className="mx-auto h-16 md:h-20 lg:h-24 w-auto mb-4"
            quality={100}
            priority
          />

          {/* Título */}
          <h1
            className="text-white dark:text-gray-100 font-extrabold leading-tight 
                       text-[28px] sm:text-[40px] md:text-[56px]"
          >
            Sistema de Gestão do Conhecimento
          </h1>

          <div
            className={[
              "mt-10 flex flex-wrap justify-center gap-6",
              "hover:[&>*:not(:hover)]:blur-[2px] hover:[&>*:not(:hover)]:scale-95 transition",
            ].join(" ")}
          >
            <CardNav
              title="Comercial"
              to="/comercial/orgaos-publicos"
              image="/images/ImgDepComercial.png"
              items={[
                { label: "Órgãos Públicos", to: "/comercial/orgaos-publicos" },
                {
                  label: "Privados / Concessionárias",
                  to: "/comercial/privconcessionaria",
                },
                { label: "Propostas", to: "/comercial/propostas" },
              ]}
            />

            <CardNav
              title="Engenharia"
              to="/engenharia/contratos"
              image="/images/ImgDepEngenharia.png"
              items={[
                { label: "Contratos", to: "/engenharia/contratos" },
                { label: "Obras", to: "/engenharia/obras" },
                { label: "Equipe", to: "/engenharia/equipe" },
              ]}
            />

            <CardNav
              title="Financeiro"
              to="/financeiro/visao-geral"
              image="/images/imgDepFinanceiro.jpg"
              items={[
                { label: "Visão Geral", to: "/financeiro/visao-geral" },
                { label: "Contas a Pagar", to: "/financeiro/pagar" },
                { label: "Contas a Receber", to: "/financeiro/receber" },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
