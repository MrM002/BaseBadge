'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

interface UserProfileProps {
  address: string
  size?: 'sm' | 'md' | 'lg'
  showGlow?: boolean
  className?: string
}

export function UserProfile({ 
  address, 
  size = 'md', 
  showGlow = true, 
  className = '' 
}: UserProfileProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
  }

  const glowClasses = showGlow ? 'absolute -inset-1 bg-gradient-to-r from-gamefi-yellow to-gamefi-yellow-glow rounded-full blur opacity-20 animate-glow-soft' : ''

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder for user profile image */}
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-gamefi-blue to-gamefi-yellow rounded-full flex items-center justify-center font-bold text-black`}>
        {address.slice(2, 4).toUpperCase()}
      </div>
      {showGlow && <div className={glowClasses}></div>}
    </div>
  )
} 