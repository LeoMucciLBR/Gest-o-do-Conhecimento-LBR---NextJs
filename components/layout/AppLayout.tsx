"use client";

import Image from "next/image";
import type { MenuItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/lib/hooks/useAuth";

// Helper function to format role for display
function formatRole(role?: string): string {
  if (!role) return "Usuário";
  
  const roleMap: Record<string, string> = {
    'admin': 'Administrador',
    'user': 'Usuário',
    'engineer': 'Engenheiro',
    'manager': 'Gerente',
    'coordinator': 'Coordenador',
    'analyst': 'Analista',
  };
  
  return roleMap[role.toLowerCase()] || role;
}

// Helper function to format area for display
function formatArea(area?: string): string {
  if (!area) return "";
  
  const areaMap: Record<string, string> = {
    'ENGENHARIA': 'Engenharia',
    'COMERCIAL': 'Comercial',
    'FINANCEIRO': 'Financeiro',
    'ADMINISTRATIVO': 'Administrativo',
    'TI': 'TI',
    'RH': 'RH',
    'DIRETORIA': 'Diretoria',
  };
  
  return areaMap[area] || area;
}

export default function AppLayout({
  sectionTitle,
  items,
  children,
}: {
  sectionTitle: string;
  items: MenuItem[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  
  // Format display as "Role - Area" or just "Role" if no area
  const userRole = user?.role ? formatRole(user.role) : "Usuário";
  const userArea = user?.area ? formatArea(user.area) : "";
  const roleDisplay = userArea ? `${userRole} - ${userArea}` : userRole;
  
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <Sidebar 
        sectionTitle={sectionTitle} 
        items={items}
        user={user ? {
          name: user.name || user.email,
          email: roleDisplay,
          photoUrl: user.photoUrl
        } : undefined}
      />

      {/* Marca d'água */}
      {/* Marca d'água */}
      <div className="fixed top-4 right-4 z-10 pointer-events-none hidden md:block">
        <Image
          src="/images/LogoLbr.png"
          alt="Logo"
          width={100}
          height={52}
          className="h-13 w-auto block dark:hidden"
          priority
        />
        <Image
          src="/images/LogoBranca.png"
          alt="Logo"
          width={100}
          height={52}
          className="h-13 w-auto hidden dark:block"
          priority
        />
      </div>



      {/* Conteúdo da área */}
      <main className="flex-1 h-screen overflow-auto transition-[margin-left] duration-300 ease-in-out">
        <div className=" min-h-full">{children}</div>
      </main>
    </div>
  );
}
