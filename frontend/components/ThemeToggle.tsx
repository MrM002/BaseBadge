'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ThemeToggleProps {
  variant?: 'fixed' | 'inline'
}

export function ThemeToggle({ variant = 'fixed' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      setIsDark(savedTheme === 'dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    setIsDark(newTheme)
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    
    // Apply theme to document
    if (newTheme) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  const baseClasses = "bg-gradient-to-br from-gray-800/80 to-black/80 backdrop-blur-sm border border-gray-700/50 hover:border-gamefi-yellow/50 transition-all duration-300 group"
  
  const classes = variant === 'fixed' 
    ? `fixed top-4 right-4 z-50 p-3 rounded-xl ${baseClasses}`
    : `p-2 rounded-lg ${baseClasses}`

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={classes}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 180 }}
        transition={{ duration: 0.3 }}
        className={variant === 'fixed' ? 'text-2xl' : 'text-lg'}
      >
        {isDark ? '🌙' : '☀️'}
      </motion.div>
    </motion.button>
  )
} 