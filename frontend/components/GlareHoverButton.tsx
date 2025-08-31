'use client'

import { motion, useMotionValue, useTransform } from 'framer-motion'
import { useRef } from 'react'

interface GlareHoverButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export default function GlareHoverButton({ children, onClick, className = '' }: GlareHoverButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const glareX = useTransform(mouseX, [0, 200], [0, 800])
  const glareY = useTransform(mouseY, [0, 100], [0, 600])

  return (
    <motion.button
      ref={buttonRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl px-8 py-4 font-semibold text-lg transition-all duration-300 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-white" />
      
      {/* Glare effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-gamefi-blue/60 to-transparent"
        style={{
          x: glareX,
          y: glareY,
          transform: 'translate(-50%, -50%)'
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Content */}
      <span className="relative z-10 text-black font-bold">
        {children}
      </span>
    </motion.button>
  )
}
