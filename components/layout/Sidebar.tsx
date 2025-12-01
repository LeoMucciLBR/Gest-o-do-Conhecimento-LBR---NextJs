"use client";

import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api/api";
import ThemeToggle from "../theme/ThemeToggle";


export type MenuItem = {
  title: string;
  icon: string; // icon name instead of function
  href: string;
  gap?: boolean;
  matchMode?: "exact" | "startsWith";
};

// Icon renderer function
function renderIcon(iconName: string, className = "h-5 w-5"): ReactNode {
  const icons: Record<string, ReactNode> = {
    chart: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 20V10M18 20V4M6 20v-4" />
      </svg>
    ),
    activity: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    user: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    calendar: (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  };
  
  return icons[iconName] || icons.chart;
}

type SidebarProps = {
  sectionTitle: string;
  items: MenuItem[];
  user?: { name: string; email: string; photoUrl?: string };
};

const Icon = {
  menu: (cls = "h-5 w-5"): ReactNode => (
    <svg
      viewBox="0 0 24 24"
      className={cls}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  close: (cls = "h-5 w-5"): ReactNode => (
    <svg
      viewBox="0 0 24 24"
      className={cls}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  ),
  logout: (cls = "h-4 w-4"): ReactNode => (
    <svg
      viewBox="0 0 24 24"
      className={cls}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export const Sidebar: FC<SidebarProps> = ({ sectionTitle, items, user }) => {
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // breakpoint lg
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  // travar scroll no drawer mobile
  useEffect(() => {
    if (!isDesktop && pinnedOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isDesktop, pinnedOpen]);

  const open = isDesktop ? pinnedOpen || hovered : pinnedOpen;

  const computedUser = useMemo(
    () => user ?? { name: "Leonardo Mucci", email: "ADM", photoUrl: "" },
    [user]
  );
  const initials = (computedUser.name || "U")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutRequest();
      router.replace("/login");
    } catch (e) {
      console.error(e);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      {/* Botão flutuante (mobile) */}
      <button
        className={[
          "lg:hidden fixed z-50 top-4 left-4 rounded-full p-3",
          "bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white shadow-xl backdrop-blur",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-lbr-primary/40 dark:focus-visible:ring-white/40",
        ].join(" ")}
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setPinnedOpen((v) => !v)}
      >
        {open ? Icon.close("h-6 w-6") : Icon.menu("h-6 w-6")}
      </button>

      {/* Overlay mobile */}
      {!isDesktop && open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
          onClick={() => setPinnedOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          "fixed z-50 h-screen lg:relative lg:z-auto",
          open ? "lg:w-72" : "lg:w-20",
          "bg-[#2f4982] backdrop-blur-xl text-white shadow-2xl flex flex-col",
          "ease-in-out border-r border-white/20",
          isDesktop
            ? "transition-[width] duration-300"
            : [
                "transition-transform duration-300",
                open ? "translate-x-0" : "-translate-x-full",
              ].join(" "),
          open ? "p-4 pt-6" : "px-2 py-4",
          "top-0 left-0 w-72",
        ].join(" ")}
        aria-label="Menu lateral"
        onMouseEnter={() => isDesktop && setHovered(true)}
        onMouseLeave={() => isDesktop && setHovered(false)}
        role={!isDesktop ? "dialog" : undefined}
        aria-modal={!isDesktop && open ? true : undefined}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div
            className={[
              "overflow-hidden origin-left",
              open ? "opacity-100 w-auto" : "opacity-0 w-0",
              "transition-[opacity,width] duration-300 ease-in-out",
            ].join(" ")}
          >
            <h1 className="font-extrabold text-2xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-lbr-primary to-blue-600 dark:from-cyan-400 dark:to-blue-400">
              {sectionTitle}
            </h1>
          </div>

          {/* Pin desktop */}
          <button
            onClick={() => setPinnedOpen((v) => !v)}
            aria-label={open ? "Fechar" : "Abrir"}
            className={[
              "rounded-full p-2 transition-colors duration-200",
              "hover:bg-gray-100 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-lbr-primary/40 dark:focus-visible:ring-white/40",
              open ? "text-lbr-primary dark:text-cyan-400" : "text-gray-500 dark:text-white/60",
              !open ? "mx-auto" : "",
              "hidden lg:inline-flex",
            ].join(" ")}
            title={open ? "Fechar" : "Abrir"}
          >
            {open ? Icon.close() : Icon.menu()}
          </button>
        </div>



        {/* Menu */}
        <nav className="flex-1 overflow-y-auto pr-1">
          <ul className="space-y-2 px-2">
            {items.map((item) => {
              const isActive = item.matchMode === "exact" 
                ? pathname === item.href
                : pathname.startsWith(item.href);
              
              return (
                <li key={item.title} className={item.gap ? "pt-4" : ""}>
                  <Link
                    href={item.href}
                    className={[
                      "w-full group flex items-center rounded-xl py-3 outline-none text-sm font-medium transition-all duration-300 ease-in-out relative overflow-hidden",
                      isActive
                        ? "bg-white/20 text-white shadow-sm"
                        : "text-white/70 hover:text-white hover:bg-white/10 hover:translate-x-1",
                      open ? "justify-start px-3" : "justify-center px-0",
                    ].join(" ")}
                    title={!open ? item.title : undefined}
                    onClick={() => {
                      if (!isDesktop) setPinnedOpen(false);
                    }}
                  >
                    {/* Active Indicator Bar */}
                    <span
                      className={[
                        "absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 ease-in-out",
                        isActive
                          ? "h-8 bg-lbr-primary dark:bg-cyan-400 opacity-100"
                          : "h-0 bg-transparent opacity-0",
                      ].join(" ")}
                    />

                    <span className="w-6 h-6 grid place-items-center flex-none shrink-0 z-10 relative">
                      {renderIcon(item.icon, isActive ? "h-5 w-5 stroke-[2.5]" : "h-5 w-5")}
                    </span>
                    <span
                      className={[
                        "ml-3 whitespace-nowrap z-10",
                        open
                          ? "opacity-100 w-auto"
                          : "opacity-0 w-0 overflow-hidden",
                        "transition-[opacity,width,transform] duration-300 ease-in-out",
                      ].join(" ")}
                    >
                      {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Rodapé (usuário + logout) */}
        {/* Rodapé (usuário + logout) */}
        <div className="mt-auto pt-6 pb-4 border-t border-white/10 dark:border-white/5">
          <div className="flex justify-center mb-6">
            <ThemeToggle />
          </div>
          <div
            className={[
              "mx-2 p-2 transition-all duration-300 ease-in-out",
              open 
                ? "rounded-2xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 backdrop-blur-sm" 
                : "rounded-full bg-transparent border-none",
            ].join(" ")}
          >
            <div
              className={[
                "flex items-center",
                open ? "gap-3 px-1" : "flex-col gap-2 justify-center",
              ].join(" ")}
            >
              <div
                className={[
                  "relative flex items-center justify-center rounded-full overflow-hidden",
                  "bg-gradient-to-br from-lbr-primary to-blue-600 dark:from-cyan-500 dark:to-blue-500 shadow-md",
                  "ring-2 ring-white dark:ring-gray-900",
                  "h-10 w-10 flex-none",
                ].join(" ")}
              >
                {computedUser.photoUrl ? (
                  <img
                    src={computedUser.photoUrl}
                    alt={computedUser.name}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-white text-xs font-bold">
                    {initials}
                  </span>
                )}
              </div>

              {/* texto do usuário só quando aberta */}
              <div
                className={[
                  "min-w-0 origin-left",
                  open ? "opacity-100 w-auto h-auto" : "opacity-0 w-0 h-0 overflow-hidden",
                  "transition-[opacity,width,height] duration-300 ease-in-out",
                ].join(" ")}
              >
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  {computedUser.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-medium">
                  {computedUser.email}
                </p>
              </div>

              {/* Botão de logout */}
              {open ? (
                <button
                  className="ml-auto p-2 rounded-xl text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  title={loggingOut ? "Saindo..." : "Sair"}
                >
                  {Icon.logout("h-4 w-4")}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
