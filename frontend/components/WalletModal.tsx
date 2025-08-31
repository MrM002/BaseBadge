'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ConnectWallet,
  Wallet,
} from '@coinbase/onchainkit/wallet'
import {
  Avatar,
  Name,
} from '@coinbase/onchainkit/identity'

interface WalletModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function WalletModal({ isOpen, onClose, onSuccess }: WalletModalProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [showWalletSelector, setShowWalletSelector] = useState(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setIsConnected(false)
      setShowWalletSelector(false)
    }
  }, [isOpen])

  const handleWalletConnect = () => {
    setIsConnected(true)
    setShowWalletSelector(true)
  }

  const handleWalletSuccess = () => {
    setIsConnected(false)
    setShowWalletSelector(false)
    onSuccess()
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-md border border-gray-800/50 rounded-2xl p-8 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gamefi-blue to-gamefi-yellow bg-clip-text text-transparent mb-3">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-400 text-lg">
                  Connect your wallet to access BaseBadge dashboard
                </p>
              </div>

              <div className="space-y-6">
                <Wallet>
                  <ConnectWallet 
                    className="w-full bg-gradient-to-r from-gamefi-blue to-gamefi-yellow hover:from-gamefi-blue hover:to-gamefi-yellow-light text-black font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-gamefi-yellow/20 animate-glow-soft flex items-center justify-center gap-3"
                  >
                    <Avatar className="h-6 w-6" />
                    <Name />
                  </ConnectWallet>
                </Wallet>

                <div className="text-sm text-gray-500">
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </div>

                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
} 