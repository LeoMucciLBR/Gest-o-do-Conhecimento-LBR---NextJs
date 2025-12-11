"use client";

import { useEffect, useMemo, useState, type FC, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { logoutRequest } from "@/lib/api/api";
import ThemeToggle from "../theme/ThemeToggle";

export type MenuItem = {
  title: string;
  icon: string;
  href: string;
  gap?: boolean;
  matchMode?: "exact" | "startsWith";
};

// Icon renderer
function renderIcon(iconName: string, className = "h-5 w-5"): ReactNode {
  const icons: Record<string, ReactNode> = {
    chart: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20V10M18 20V4M6 20v-4" />
      </svg>
    ),
    activity: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
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
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  close: (cls = "h-5 w-5"): ReactNode => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6l-12 12" />
    </svg>
  ),
  logout: (cls = "h-4 w-4"): ReactNode => (
    <svg viewBox="0 0 24 24" className={cls} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  sparkles: (cls = "h-4 w-4"): ReactNode => (
    <svg viewBox="0 0 24 24" className={cls} fill="currentColor">
      <path d="M12 0C11.4477 0 11 0.447715 11 1V3C11 3.55228 11.4477 4 12 4C12.5523 4 13 3.55228 13 3V1C13 0.447715 12.5523 0 12 0Z"/>
      <path d="M19.0711 4.92893C18.6805 4.53841 18.0474 4.53841 17.6569 4.92893L16.2426 6.34315C15.8521 6.73367 15.8521 7.36684 16.2426 7.75736C16.6332 8.14788 17.2663 8.14788 17.6569 7.75736L19.0711 6.34315C19.4616 5.95262 19.4616 5.31946 19.0711 4.92893Z"/>
      <path d="M24 11C24 10.4477 23.5523 10 23 10H21C20.4477 10 20 10.4477 20 11C20 11.5523 20.4477 12 21 12H23C23.5523 12 24 11.5523 24 11Z"/>
      <path d="M4 11C4 10.4477 3.55228 10 3 10H1C0.447715 10 0 10.4477 0 11C0 11.5523 0.447715 12 1 12H3C3.55228 12 4 11.5523 4 11Z"/>
      <path d="M7.75736 16.2426C7.36684 15.8521 6.73367 15.8521 6.34315 16.2426L4.92893 17.6569C4.53841 18.0474 4.53841 18.6805 4.92893 19.0711C5.31946 19.4616 5.95262 19.4616 6.34315 19.0711L7.75736 17.6569C8.14788 17.2663 8.14788 16.6332 7.75736 16.2426Z"/>
    </svg>
  ),
};

export const Sidebar: FC<SidebarProps> = ({ sectionTitle, items, user }) => {
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const apply = () => setIsDesktop(mql.matches);
    apply();
    mql.addEventListener?.("change", apply);
    return () => mql.removeEventListener?.("change", apply);
  }, []);

  useEffect(() => {
    if (!isDesktop && pinnedOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isDesktop, pinnedOpen]);

  // Buscar contador de notificações
  useEffect(() => {
    async function fetchNotificationCount() {
      try {
        const response = await fetch('/api/contracts/notifications/count');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    }

    fetchNotificationCount();

    // Polling a cada 30 segundos
    const interval = setInterval(fetchNotificationCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const open = isDesktop ? pinnedOpen || hovered : pinnedOpen;

  const computedUser = useMemo(
    () => user ?? { name: "Usuário", email: "Função não definida", photoUrl: "" },
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
      {/* Mobile Toggle - Glassmorphism */}
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="lg:hidden fixed z-50 top-6 left-6 w-14 h-14 rounded-2xl bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl flex items-center justify-center"
          onClick={() => setPinnedOpen((v) => !v)}
        >
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="text-[#2f4982] dark:text-white"
          >
            {open ? Icon.close("h-6 w-6") : Icon.menu("h-6 w-6")}
          </motion.div>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#2f4982]/20"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 25 }}
          />
        </motion.button>
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {!isDesktop && open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-gradient-to-br from-black/80 to-[#2f4982]/60 backdrop-blur-md"
            onClick={() => setPinnedOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isDesktop ? (open ? 320 : 88) : 320,
          x: isDesktop ? 0 : open ? 0 : -320,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200 }}
        onMouseEnter={() => isDesktop && setHovered(true)}
        onMouseLeave={() => isDesktop && setHovered(false)}
        className="fixed lg:relative z-50 h-screen bg-white dark:bg-slate-900 shadow-2xl shadow-black/20 dark:shadow-black/60 flex flex-col overflow-hidden"
      >
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2f4982] via-blue-500 to-blue-600" />

        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08]">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2f4982" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          {/* Header */}
          <div className={`px-6 pt-8 pb-6 flex items-center ${open ? 'justify-between' : 'justify-center'} min-h-[80px] transition-all duration-300`}>
            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <h1 className="text-xl font-black text-slate-900 dark:text-white truncate">
                    {sectionTitle}
                  </h1>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setPinnedOpen(!pinnedOpen);
              }}
              className={`p-2 rounded-lg transition-all duration-300 ${
                pinnedOpen 
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={pinnedOpen ? "Destravar sidebar" : "Travar sidebar"}
            >
              <motion.svg
                viewBox="0 0 24 24"
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M3 6h18"
                  animate={pinnedOpen ? { d: "M3 6h18", rotate: 45, translateY: 6, translateX: 0 } : { d: "M3 6h18", rotate: 0, translateY: 0, translateX: 0 }}
                  style={{ originX: "50%", originY: "50%" }}
                />
                <motion.path
                  d="M3 12h18"
                  animate={pinnedOpen ? { opacity: 0 } : { opacity: 1 }}
                />
                <motion.path
                  d="M3 18h18"
                  animate={pinnedOpen ? { d: "M3 18h18", rotate: -45, translateY: -6, translateX: 0 } : { d: "M3 18h18", rotate: 0, translateY: 0, translateX: 0 }}
                  style={{ originX: "50%", originY: "50%" }}
                />
              </motion.svg>
            </button>
          </div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mt-6"
            />

          {/* Navigation */}
          <nav className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent ${open ? 'px-4' : ''}`}>
            <ul className="space-y-1.5 py-2">


              {items.map((item, idx) => {
                const isActive =
                  item.matchMode === "exact"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);

                return (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={item.gap ? "pt-6 border-t border-slate-200 dark:border-slate-800 mt-2" : ""}
                  >
                    <Link href={item.href} onClick={() => !isDesktop && setPinnedOpen(false)}>
                      <motion.div
                        whileHover={{ x: 6 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group"
                      >
                        <div
                          className={`
                            flex items-center rounded-2xl transition-all duration-300
                            ${!open ? 'w-full justify-center py-3' : 'gap-4 px-4 py-3'}
                            ${isActive && open
                              ? 'bg-gradient-to-r from-[#2f4982] to-blue-600 text-white shadow-lg shadow-[#2f4982]/30' 
                              : isActive && !open
                              ? ''
                              : open
                              ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }
                          `}
                        >
                          {/* Icon with background circle */}
                          <div className={`
                            relative flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl transition-colors
                            ${isActive && !open
                              ? 'bg-gradient-to-br from-[#2f4982] to-blue-600 shadow-lg shadow-[#2f4982]/30' 
                              : !isActive
                              ? 'bg-slate-100 dark:bg-slate-800 group-hover:bg-[#2f4982]/10'
                              : 'bg-transparent'
                            }
                          `}>
                            {renderIcon(item.icon, `h-6 w-6 ${
                              isActive && open 
                                ? 'text-white' 
                                : isActive && !open
                                ? 'text-white'
                                : 'text-[#2f4982] dark:text-slate-400'
                            }`)}
                          </div>

                          {/* Text */}
                          <motion.span
                            animate={{
                              opacity: open ? 1 : 0,
                              width: open ? "auto" : 0,
                            }}
                            transition={{ duration: 0.2 }}
                            className={`text-sm font-semibold whitespace-nowrap overflow-hidden ${
                              isActive && open 
                                ? 'text-white' 
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {item.title}
                          </motion.span>

                          {/* Active indicator - linha lateral direita */}
                          {isActive && open && (
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              exit={{ scaleY: 0 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 500,
                                damping: 35,
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/80"
                            />
                          )}

                          {/* Notification badge - contador dinâmico */}
                          {item.title === "Contratos" && open && unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
                            >
                              {unreadCount}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.li>
                );
              })}

              {/* Divider */}
              <div className="mx-4 my-2 h-px bg-slate-200 dark:bg-slate-800" />

              {/* Portal Item - Always Present */}
              {(() => {
                const isPortalActive = pathname === "/portal";
                return (
                  <motion.li
                    key="/portal"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2"
                  >
                    <Link href="/portal" onClick={() => !isDesktop && setPinnedOpen(false)}>
                      <motion.div
                        whileHover={{ x: 6 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group"
                      >
                        <div
                          className={`
                            flex items-center rounded-2xl transition-all duration-300
                            ${!open ? 'w-full justify-center py-3' : 'gap-4 px-4 py-3'}
                            ${isPortalActive && open
                              ? 'bg-gradient-to-r from-[#2f4982] to-blue-600 text-white shadow-lg shadow-[#2f4982]/30' 
                              : isPortalActive && !open
                              ? ''
                              : open
                              ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                            }
                          `}
                        >
                          {/* Icon with background circle */}
                          <div className={`
                            relative flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl transition-colors
                            ${isPortalActive && !open
                              ? 'bg-gradient-to-br from-[#2f4982] to-blue-600 shadow-lg shadow-[#2f4982]/30' 
                              : !isPortalActive
                              ? 'bg-slate-100 dark:bg-slate-800 group-hover:bg-[#2f4982]/10'
                              : 'bg-transparent'
                            }
                          `}>
                            {Icon.sparkles(`h-6 w-6 ${
                              isPortalActive && open 
                                ? 'text-white' 
                                : isPortalActive && !open
                                ? 'text-white'
                                : 'text-[#2f4982] dark:text-slate-400'
                            }`)}
                          </div>

                          {/* Text */}
                          <motion.span
                            animate={{
                              opacity: open ? 1 : 0,
                              width: open ? "auto" : 0,
                            }}
                            transition={{ duration: 0.2 }}
                            className={`text-sm font-semibold whitespace-nowrap overflow-hidden ${
                              isPortalActive && open 
                                ? 'text-white' 
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            Portal
                          </motion.span>

                          {/* Active indicator */}
                          {isPortalActive && open && (
                            <motion.div
                              initial={{ scaleY: 0 }}
                              animate={{ scaleY: 1 }}
                              exit={{ scaleY: 0 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 500,
                                damping: 35,
                              }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/80"
                            />
                          )}
                        </div>
                      </motion.div>
                    </Link>
                  </motion.li>
                );
              })()}
            </ul>
          </nav>

          {/* Footer */}
          <div className="mt-auto px-4 pb-6 space-y-4">
            {/* Theme Toggle */}
            <div className="flex justify-center">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm"
              >
                <ThemeToggle />
              </motion.div>
            </div>

            {/* User Card Premium */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {open ? (
                  // Card aberto - Premium
                  <motion.div
                    key="open-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl"
                  >
                    {/* Animated gradient overlay */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />

                    <div className="relative p-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar Premium */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.95 }}
                          className="relative"
                        >
                          {/* Glow effect */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-[#2f4982] to-blue-500 rounded-full blur-md opacity-60" />
                          
                          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-xl">
                            {computedUser.photoUrl ? (
                              <img
                                src={computedUser.photoUrl}
                                alt={computedUser.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#2f4982] to-blue-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">{initials}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {computedUser.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {computedUser.email}
                          </p>
                        </div>

                        {/* Logout button premium */}
                        <motion.button
                          whileHover={{ scale: 1.1, rotate: 10 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={handleLogout}
                          disabled={loggingOut}
                          className="relative group p-3 rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/40 text-red-600 dark:text-red-400 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-200 disabled:opacity-50"
                          title="Sair"
                        >
                          <motion.div
                            animate={loggingOut ? { rotate: 360 } : {}}
                            transition={{ duration: 1, repeat: loggingOut ? Infinity : 0, ease: "linear" }}
                          >
                            {Icon.logout("h-5 w-5")}
                          </motion.div>
                          
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                            Sair
                          </div>
                        </motion.button>
                      </div>

                      {/* Decorative bottom bar */}
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        className="mt-3 h-1 rounded-full bg-gradient-to-r from-[#2f4982] to-blue-500"
                      />
                    </div>
                  </motion.div>
                ) : (
                  // Card fechado - Apenas Avatar
                  <motion.div
                    key="closed-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-center"
                  >
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative cursor-pointer"
                    >
                      {/* Glow effect */}
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#2f4982] to-blue-600 rounded-full blur-md opacity-50" />
                      
                      <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-white dark:ring-slate-700 shadow-2xl">
                        {computedUser.photoUrl ? (
                          <img
                            src={computedUser.photoUrl}
                            alt={computedUser.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#2f4982] to-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">{initials}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
