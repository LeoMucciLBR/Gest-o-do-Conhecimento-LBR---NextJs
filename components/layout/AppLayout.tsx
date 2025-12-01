import Image from "next/image";
import type { MenuItem } from "./Sidebar";
import { Sidebar } from "./Sidebar";


export default function AppLayout({
  sectionTitle,
  items,
  children,
}: {
  sectionTitle: string;
  items: MenuItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-slate-900 text-gray-900 dark:text-gray-100">
      <Sidebar sectionTitle={sectionTitle} items={items} />

      {/* Marca d'água */}
      <div className="fixed top-4 right-4 z-50 pointer-events-none">
        <Image
          src="/images/LogoLbr.png"
          alt="Logo"
          width={100}
          height={52}
          className="h-13 w-auto"
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
