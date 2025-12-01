'use client'

import { motion } from 'framer-motion'

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Simple visible gradient orbs - all using #233a74 */}
      <motion.div
        className="absolute top-10 right-10 w-96 h-96 rounded-full"
        style={{ backgroundColor: '#233a74', opacity: 0.2 }}
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute bottom-10 left-10 w-96 h-96 rounded-full"
        style={{ backgroundColor: '#233a74', opacity: 0.2 }}
        animate={{
          scale: [1, 1.3, 1],
          y: [0, -50, 0],
        }}
        transition={{ duration: 7, repeat: Infinity }}
      />
      
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
        style={{ backgroundColor: '#233a74', opacity: 0.15 }}
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    </div>
  )
}
