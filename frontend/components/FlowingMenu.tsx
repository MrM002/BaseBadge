'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FlowingMenuProps {
  items: {
    id: string
    title: string
    description: string
    icon: string
    color?: string
    action?: () => void
  }[]
  className?: string
}

export default function FlowingMenu({ items, className = '' }: FlowingMenuProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getColorScheme = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'from-gamefi-blue/20 to-gamefi-blue-dark/20',
          border: 'border-gamefi-blue/50',
          shadow: 'shadow-gamefi-blue/20',
          glow: 'from-gamefi-blue/30 to-gamefi-blue-dark/30'
        }
      case 'yellow':
        return {
          bg: 'from-gamefi-yellow/20 to-gamefi-yellow-glow/20',
          border: 'border-gamefi-yellow/50',
          shadow: 'shadow-gamefi-yellow/20',
          glow: 'from-gamefi-yellow/30 to-gamefi-yellow-glow/30'
        }
      case 'purple':
        return {
          bg: 'from-gamefi-purple/20 to-gamefi-purple/60',
          border: 'border-gamefi-purple/50',
          shadow: 'shadow-gamefi-purple/20',
          glow: 'from-gamefi-purple/30 to-gamefi-purple/60'
        }
      case 'green':
        return {
          bg: 'from-gamefi-green/20 to-gamefi-green/60',
          border: 'border-gamefi-green/50',
          shadow: 'shadow-gamefi-green/20',
          glow: 'from-gamefi-green/30 to-gamefi-green/60'
        }
      case 'orange':
        return {
          bg: 'from-gamefi-orange/20 to-gamefi-orange/60',
          border: 'border-gamefi-orange/50',
          shadow: 'shadow-gamefi-orange/20',
          glow: 'from-gamefi-orange/30 to-gamefi-orange/60'
        }
      default:
        return {
          bg: 'from-gamefi-blue/20 to-gamefi-blue-dark/20',
          border: 'border-gamefi-blue/50',
          shadow: 'shadow-gamefi-blue/20',
          glow: 'from-gamefi-blue/30 to-gamefi-blue-dark/30'
        }
    }
  }

  useEffect(() => {
    if (isExpanded) {
      intervalRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % items.length)
      }, 2000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isExpanded, items.length])

  const handleItemClick = (item: any) => {
    if (item.action) {
      item.action()
    }
    setActiveIndex(items.findIndex(i => i.id === item.id))
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main container */}
      <div className="relative">
        {/* Central button */}
        <motion.button
          onClick={() => {
            setIsExpanded(!isExpanded)
            // Scroll to top when clicked
            if (!isExpanded) {
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
          className="relative z-30 w-32 h-24 bg-gamefi-blue rounded-full shadow-2xl shadow-gamefi-blue/30 flex items-center justify-center text-white font-bold text-lg"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            rotate: isExpanded ? 180 : 0,
            scale: isExpanded ? 1.1 : 1
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {isExpanded ? '✕' : '⬆️'}
        </motion.button>

        {/* Flowing menu items */}
        <AnimatePresence>
          {isExpanded && (
            <>
              {/* Background glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-gamefi-blue/20 to-gamefi-yellow/20 rounded-full blur-3xl"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              />

                             {/* Menu items - only show first 2 items */}
               {items.slice(0, 2).map((item, index) => {
                 const angle = index === 0 ? 180 : 0 // Left and right
                 const radius = 200
                 const x = Math.cos((angle * Math.PI) / 180) * radius
                 const y = Math.sin((angle * Math.PI) / 180) * radius
                 const isActive = index === activeIndex

                return (
                  <motion.div
                    key={item.id}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ 
                      x, 
                      y, 
                      opacity: 1, 
                      scale: 1,
                      rotate: isActive ? [0, 5, -5, 0] : 0
                    }}
                    exit={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                    whileHover={{ scale: 1.1, z: 50 }}
                  >
                    {/* Menu item card */}
                    <motion.div
                      onClick={() => handleItemClick(item)}
                      className={`
                        relative cursor-pointer group
                        ${isActive ? 'z-20' : 'z-10'}
                      `}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Card */}
                      <div className={`
                        w-48 p-6 rounded-2xl border-2 transition-all duration-300
                        ${isActive 
                          ? `bg-gradient-to-br ${getColorScheme(item.color || 'blue').bg} border-${getColorScheme(item.color || 'blue').border} shadow-2xl ${getColorScheme(item.color || 'blue').shadow}` 
                          : 'bg-gray-900/80 border-gray-800/40 hover:border-gamefi-blue/30'
                        }
                      `}>
                        {/* Icon */}
                        <div className={`
                          text-4xl mb-4 text-center transition-all duration-300
                          ${isActive ? 'scale-110 text-gamefi-yellow' : 'text-gray-400 group-hover:text-gamefi-blue'}
                        `}>
                          {item.icon}
                        </div>
                        
                        {/* Title */}
                        <h3 className={`
                          text-lg font-bold mb-2 text-center transition-all duration-300
                          ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}
                        `}>
                          {item.title}
                        </h3>
                        
                        {/* Description */}
                        <p className={`
                          text-sm text-center leading-relaxed transition-all duration-300
                          ${isActive ? 'text-gray-300' : 'text-gray-500 group-hover:text-gray-400'}
                        `}>
                          {item.description}
                        </p>

                                              {/* Active indicator */}
                      {isActive && (
                        <motion.div
                          className="absolute -top-2 -right-2 w-4 h-4 bg-white rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        />
                      )}
                      </div>

                      {/* Glow effect for active item */}
                      {isActive && (
                        <motion.div
                          className={`absolute -inset-2 rounded-3xl bg-gradient-to-r ${getColorScheme(item.color || 'blue').glow} blur-xl`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                        />
                      )}
                    </motion.div>
                  </motion.div>
                )
              })}
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isExpanded ? 1 : 0, y: isExpanded ? 0 : 20 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <p className="text-gray-400 text-sm">
          {isExpanded 
            ? "Click on any option to explore further" 
            : "Click to explore your options"
          }
        </p>
      </motion.div>
    </div>
  )
}
