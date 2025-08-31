'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RotatingTextProps {
  words: { text: string; color: 'blue' | 'yellow' | 'white' | 'purple' | 'green' | 'orange' }[]
  className?: string
  speed?: number
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
}

export default function RotatingText({ 
  words, 
  className = '', 
  speed = 2000,
  size = '4xl'
}: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, speed)

    return () => clearInterval(interval)
  }, [words.length, speed])

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue':
        return 'text-gamefi-blue'
      case 'yellow':
        return 'text-gamefi-yellow'
      case 'white':
        return 'text-white'
      case 'purple':
        return 'text-gamefi-purple'
      case 'green':
        return 'text-gamefi-green'
      case 'orange':
        return 'text-gamefi-orange'
      default:
        return 'text-white'
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-sm'
      case 'md':
        return 'text-base'
      case 'lg':
        return 'text-lg'
      case 'xl':
        return 'text-xl'
      case '2xl':
        return 'text-2xl'
      case '3xl':
        return 'text-3xl'
      case '4xl':
        return 'text-4xl'
      case '5xl':
        return 'text-5xl'
      case '6xl':
        return 'text-6xl'
      default:
        return 'text-4xl'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
                 <motion.span
           key={currentIndex}
           className={`font-bold ${getSizeClass()} ${getColorClass(words[currentIndex].color)}`}
           initial={{ opacity: 0, y: 20, rotateX: -90 }}
           animate={{ opacity: 1, y: 0, rotateX: 0 }}
           exit={{ opacity: 0, y: -20, rotateX: 90 }}
           transition={{ duration: 0.5, ease: "easeOut" }}
         >
           {words[currentIndex].text}
         </motion.span>
      </AnimatePresence>
      
              {/* Cursor */}
        <motion.span
          className="inline-block w-1 h-full bg-gradient-to-r from-gamefi-blue to-gamefi-yellow ml-1"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
    </div>
  )
}
