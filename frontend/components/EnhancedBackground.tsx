'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

export default function EnhancedBackground() {

  // Galaxy stars
  const stars = useMemo(() => {
    return Array.from({ length: 200 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      opacity: Math.random() * 0.9 + 0.1,
      delay: Math.random() * 3,
      duration: Math.random() * 4 + 3
    }))
  }, [])

  // Nebula clouds
  const nebulas = useMemo(() => {
    return [
      {
        id: 1,
        size: 600,
        blur: 120,
        pos: { top: '-20%', left: '-15%' },
        bg: 'radial-gradient(circle at 30% 30%, rgba(80, 180, 255, 0.3), transparent 70%)'
      },
      {
        id: 2,
        size: 500,
        blur: 100,
        pos: { bottom: '-15%', right: '-10%' },
        bg: 'radial-gradient(circle at 70% 70%, rgba(255, 184, 0, 0.25), transparent 70%)'
      },
      {
        id: 3,
        size: 400,
        blur: 80,
        pos: { top: '35%', left: '45%' },
        bg: 'radial-gradient(circle at 50% 50%, rgba(107, 70, 193, 0.2), transparent 70%)'
      }
    ]
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" id="bb-bg-root">
      {/* Base gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gamefi-black via-gamefi-dark-blue to-black" />
      
      {/* Galaxy stars */}
      <div className="absolute inset-0">
        {stars.map((star) => (
          <motion.div
            key={star.id}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity
            }}
            animate={{
              opacity: [star.opacity, star.opacity * 0.4, star.opacity],
              scale: [1, 1.3, 1]
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Nebula clouds */}
      {nebulas.map((nebula) => (
        <motion.div
          key={nebula.id}
          className="absolute"
          style={{
            width: nebula.size,
            height: nebula.size,
            filter: `blur(${nebula.blur}px)`,
            ...nebula.pos
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{ background: nebula.bg }}
          />
        </motion.div>
      ))}



      {/* Additional cosmic elements */}
      <div className="absolute inset-0">
        {/* Energy waves */}
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(ellipse 1000px 300px at 50% 50%, rgba(0, 82, 255, 0.03), transparent)'
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Cosmic dust particles */}
        {Array.from({ length: 80 }, (_, i) => (
          <motion.div
            key={`dust-${i}`}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
            animate={{
              y: [0, -150, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              delay: Math.random() * 15,
              ease: "linear"
            }}
          />
        ))}
      </div>
    </div>
  )
}
