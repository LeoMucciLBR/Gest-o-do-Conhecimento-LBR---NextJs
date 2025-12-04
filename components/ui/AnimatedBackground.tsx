'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Definição dos tipos para os elementos técnicos
  type BaseElement = { top: string; left: string; delay: number }
  type CrossElement = BaseElement & { type: 'cross' }
  type CircleElement = BaseElement & { type: 'circle'; size: number }
  type LineElement = BaseElement & { type: 'line'; width: string; rotate: number }
  
  type TechnicalElement = CrossElement | CircleElement | LineElement

  // Elementos técnicos de engenharia (linhas, cruzes, medidas)
  const technicalElements: TechnicalElement[] = [
    // Cruzes de marcação (Grid points)
    ...Array.from({ length: 12 }).map((_, i) => ({
      type: 'cross' as const,
      top: `${Math.floor(i / 4) * 30 + 10}%`,
      left: `${(i % 4) * 25 + 10}%`,
      delay: i * 0.2,
    })),
    // Círculos de "medida" ou "foco"
    { type: 'circle', top: '20%', left: '15%', size: 120, delay: 0 },
    { type: 'circle', top: '70%', left: '80%', size: 180, delay: 2 },
  ]

  // Definição dos caminhos das rodovias para formar uma "Malha Rodoviária" (Road Network)
  const highwayPaths = [
    // --- HORIZONTAL ARTERIALS (Leste-Oeste) ---
    // Top Highway
    { d: "M -100 200 C 400 100, 800 300, 1200 200 S 1800 100, 2020 200", duration: 25, delay: 0 },
    // Bottom Highway
    { d: "M -100 900 C 500 950, 1000 800, 1500 950 S 1900 850, 2020 900", duration: 22, delay: 1 },

    // --- VERTICAL ARTERIALS (Norte-Sul) ---
    // Left Highway
    { d: "M 300 -100 C 200 300, 400 600, 300 1180", duration: 24, delay: 3 },
    // Right Highway
    { d: "M 1620 -100 C 1700 400, 1550 800, 1620 1180", duration: 26, delay: 4 },

    // --- DIAGONAL EXPRESSWAYS (Cruzamentos) ---
    // TL to BR
    { d: "M -100 100 C 600 100, 900 500, 1920 1000", duration: 20, delay: 1.5 },
    // TR to BL
    { d: "M 2020 100 C 1300 200, 1000 500, -100 1000", duration: 21, delay: 2.5 },

    // --- CONNECTORS & LOOPS (Interconexões) ---
    // Central Ring/Loop
    { d: "M 700 540 C 700 300, 1220 300, 1220 540 S 700 780, 700 540", duration: 35, delay: 5 },
  ]

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#f0f4f8] dark:bg-[#0f172a] transition-colors duration-500">
      
      {/* --- LIGHT MODE: BLUEPRINT STYLE --- */}
      <div className="absolute inset-0 opacity-10 dark:opacity-0 transition-opacity duration-500">
        {/* Grid Milimetrado Azulado */}
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, #2f4982 1px, transparent 1px),
              linear-gradient(to bottom, #2f4982 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            opacity: 0.3
          }} 
        />
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(to right, #2f4982 2px, transparent 2px),
              linear-gradient(to bottom, #2f4982 2px, transparent 2px)
            `,
            backgroundSize: '200px 200px',
            opacity: 0.4
          }} 
        />
      </div>

      {/* --- DARK MODE: CYBER BLUEPRINT STYLE --- */}
      <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
        {/* Gradiente profundo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#172033] to-[#0f172a]" />
        
        {/* Grid Neon Tecnológico */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #2f4982 1px, transparent 1px),
              linear-gradient(to bottom, #2f4982 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
          }} 
        />
      </div>

      {/* --- ELEMENTOS FLUTUANTES DE ENGENHARIA (Comuns aos dois modos) --- */}
      
      {/* 1. Highway Network Effect - Complex Curves & Drawing */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 0 }}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Render Solid Paths - Optimized (No Blur Filter) */}
        {highwayPaths.map((path, i) => (
          <motion.path
            key={i}
            d={path.d}
            fill="none"
            stroke="currentColor"
            className="text-[#2f4982] dark:text-blue-400/40"
            strokeWidth="3"
            strokeLinecap="round"
            // Removed expensive filter="url(#glow)" for performance
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: [0, 1, 1, 0], opacity: [1, 1, 1, 0] }}
            transition={{ 
              duration: path.duration, 
              times: [0, 0.6, 0.9, 1], 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: path.delay 
            }}
          />
        ))}
      </svg>

      {technicalElements.map((el, i) => {
        if (el.type === 'cross') {
          return (
            <motion.div
              key={i}
              className="absolute w-4 h-4 flex items-center justify-center"
              style={{ top: el.top, left: el.left }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, delay: el.delay }}
            >
              <div className="absolute w-full h-[1px] bg-[#2f4982] dark:bg-blue-400/30" />
              <div className="absolute h-full w-[1px] bg-[#2f4982] dark:bg-blue-400/30" />
            </motion.div>
          )
        }
        if (el.type === 'circle') {
          return (
            <motion.div
              key={i}
              className="absolute border border-[#2f4982] dark:border-blue-400/20 rounded-full"
              style={{ 
                top: el.top, 
                left: el.left, 
                width: el.size, 
                height: el.size 
              }}
              animate={{ rotate: 360, scale: [1, 1.05, 1] }}
              transition={{ 
                rotate: { duration: 60, repeat: Infinity, ease: "linear" },
                scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className="absolute inset-2 border border-[#2f4982] dark:border-blue-400/10 rounded-full" />
              <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-[#2f4982] rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping" />
            </motion.div>
          )
        }
        if (el.type === 'line') {
          return (
            <motion.div
              key={i}
              className="absolute bg-[#2f4982] dark:bg-blue-400/10"
              style={{ 
                top: el.top, 
                left: el.left, 
                width: el.width, 
                height: '1px',
                rotate: el.rotate
              }}
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: [0, 1, 1, 0], originX: [0, 0, 1, 1] }}
              transition={{ duration: 8, repeat: Infinity, delay: el.delay, ease: "easeInOut" }}
            />
          )
        }
      })}

      {/* Formas Geométricas Sutis (Wireframes) */}
      <motion.div
        className="absolute top-[15%] right-[10%] w-64 h-64 border border-[#2f4982] dark:border-blue-400/10 opacity-40"
        animate={{ rotate: 90, scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="absolute inset-0 border border-[#2f4982] rotate-45 scale-75" />
      </motion.div>

      <motion.div
        className="absolute bottom-[20%] left-[5%] w-48 h-48 border-2 border-[#2f4982] dark:border-blue-400/10 rounded-full opacity-30"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-white/60 dark:to-black/60 pointer-events-none" />
    </div>
  )
}
