// menus/menus.tsx
import type { MenuItem } from "@/components/layout/Sidebar";

export const MENUS = {
  comercial: [
    {
      title: "Órgãos Públicos",
      icon: "chart",
      href: "/comercial/orgaos-publicos",
      matchMode: "startsWith",
    },
    {
      title: "Privados/Concessionárias",
      icon: "activity",
      href: "/comercial/privconcessionaria",
      matchMode: "startsWith",
    },
    {
      title: "Propostas em Andamento",
      icon: "user",
      href: "/comercial/propostas",
      gap: true,
      matchMode: "startsWith",
    },
    {
      title: "Propostas Finalizadas",
      icon: "calendar",
      href: "/comercial/finalizadas",
      matchMode: "startsWith",
    },
  ] as MenuItem[],

  engenharia: [
    {
      title: "Contratos",
      icon: "chart",
      href: "/engenharia/contratos",
      matchMode: "startsWith",
    },
    {
      title: "Obras",
      icon: "map",
      href: "/mapa-obras",
      matchMode: "startsWith",
    },
    {
      title: "Equipe",
      icon: "user",
      href: "/engenharia/equipe",
      gap: true,
      matchMode: "startsWith",
    },
  ] as MenuItem[],

  financeiro: [
    {
      title: "Visão Geral",
      icon: "chart",
      href: "/financeiro/visao-geral",
      matchMode: "startsWith",
    },
    {
      title: "Contas a Pagar",
      icon: "activity",
      href: "/financeiro/pagar",
      matchMode: "startsWith",
    },
    {
      title: "Contas a Receber",
      icon: "user",
      href: "/financeiro/receber",
      gap: true,
      matchMode: "startsWith",
    },
  ] as MenuItem[],
};
