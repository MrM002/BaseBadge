'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

interface BackendStatusProps {
  className?: string
}

export function BackendStatus({ className = '' }: BackendStatusProps) {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const [showToast, setShowToast] = useState(false)

  // Extracted check function for reuse
  const checkBackendStatus = useCallback(async () => {
    setIsChecking(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      setIsOnline(response.ok)
      setShowToast(!response.ok)
    } catch (error) {
      setIsOnline(false)
      setShowToast(true)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    checkBackendStatus()
    // Check every 5 seconds
    const interval = setInterval(checkBackendStatus, 5000)
    return () => clearInterval(interval)
  }, [checkBackendStatus])

  if (isChecking) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative group cursor-pointer ${className}`}
      >
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" onClick={checkBackendStatus}></div>
        {/* Tooltip for checking state */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-gray-300 text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-lg border border-gray-700">
          Checking backend...
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent border-t-gray-900"></div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative group cursor-pointer ${className}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}
        onClick={checkBackendStatus}
        style={{ cursor: 'pointer' }}
        title="Click to refresh backend status"
      ></div>
      {/* Tooltip for online/offline state */}
      <div className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-lg border ${
        isOnline 
          ? 'bg-green-900 text-green-300 border-green-700' 
          : 'bg-red-900 text-red-300 border-red-700'
      }`}>
        {isOnline ? 'Backend Online' : 'Backend Offline'}
        {/* Arrow pointing down */}
        <div className={`absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-t-3 border-transparent ${
          isOnline ? 'border-t-green-900' : 'border-t-red-900'
        }`}></div>
      </div>

      {/* Simple offline toast */}
      {!isChecking && showToast && !isOnline && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-red-900/90 text-red-100 px-4 py-3 rounded-lg shadow-lg border border-red-800">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>Backend offline. Some features may not work.</span>
          </div>
        </div>
      )}
    </motion.div>
  )
} 