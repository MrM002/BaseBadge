'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface StatsCarouselProps {
  stats: {
    number: string
    label: string
    icon: string
  }[]
  className?: string
}

export default function StatsCarousel({ stats, className = '' }: StatsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % stats.length)
      }, 3000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoPlaying, stats.length])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % stats.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + stats.length) % stats.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main carousel container */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-gray-800/60 p-8">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-gamefi-blue/10 to-gamefi-blue-dark/10 opacity-20" />
        
        {/* Stats display */}
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                className="text-8xl mb-6"
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <motion.span
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.5, rotate: 180 }}
                  transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
                >
                  {stats[currentIndex].icon}
                </motion.span>
              </motion.div>
              
              {/* Number */}
              <motion.h3
                className="text-6xl md:text-7xl font-bold text-white mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {stats[currentIndex].number}
              </motion.h3>
              
              {/* Label */}
              <motion.p
                className="text-2xl text-gray-300 font-semibold"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
              >
                {stats[currentIndex].label}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation arrows */}
        <motion.button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-gray-800/60 hover:bg-gray-700/80 text-white transition-all duration-300 hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </motion.button>

        <motion.button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-3 rounded-full bg-gray-800/60 hover:bg-gray-700/80 text-white transition-all duration-300 hover:scale-110"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </motion.button>

        {/* Auto-play toggle */}
        <motion.button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-800/60 hover:bg-gray-700/80 text-white transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isAutoPlaying ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </motion.button>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-8 gap-3">
        {stats.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300 cursor-pointer
              ${index === currentIndex 
                ? 'bg-gradient-to-r from-gamefi-blue via-gamefi-purple to-gamefi-yellow scale-125' 
                : 'bg-gray-600 hover:bg-gray-400'
              }
            `}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-full bg-gray-800/60 rounded-full h-1 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gamefi-blue via-gamefi-purple to-gamefi-yellow"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / stats.length) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}
