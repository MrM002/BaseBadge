'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition-colors duration-200 border border-gray-700/50 text-white"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-6 z-50"
          >
            <div className="text-white font-semibold mb-3 text-lg">Notifications</div>
            <div className="text-gray-300 text-sm mb-4">
              We're working on bringing you real-time alerts and detailed security notifications.
            </div>
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30">
              <div className="text-blue-400 text-sm font-medium mb-2">🚧 Coming Soon</div>
              <div className="text-gray-300 text-xs">
                Get instant alerts about suspicious activities, risky contracts, and security threats detected in your wallet.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


