'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
// Icons using emojis instead of lucide-react

interface AddressSearchProps {
  onSearch: (address: string) => void
  isLoading?: boolean
}

export function AddressSearch({ onSearch, isLoading = false }: AddressSearchProps) {
  const [address, setAddress] = useState('')
  const [isValid, setIsValid] = useState<boolean | null>(null)

  const validateAddress = (addr: string) => {
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    const basenameRegex = /^[a-zA-Z0-9-]+\.base\.eth$/
    
    if (ethAddressRegex.test(addr)) {
      return true
    }
    if (basenameRegex.test(addr)) {
      return true
    }
    return false
  }

  const handleAddressChange = (value: string) => {
    setAddress(value)
    if (value.length > 0) {
      setIsValid(validateAddress(value))
    } else {
      setIsValid(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid && address) {
      onSearch(address)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-gray-400 text-lg">🔍</span>
          <input
            type="text"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder="Enter wallet address or Basename (e.g., 0x1234... or user.base.eth)"
            className={`w-full pl-12 pr-12 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-badge-primary transition-all duration-200 ${
              isValid === null
                ? 'border-base-gray-300 dark:border-base-gray-600'
                : isValid
                ? 'border-badge-success focus:ring-badge-success'
                : 'border-badge-danger focus:ring-badge-danger'
            } bg-white dark:bg-base-gray-800 text-base-gray-900 dark:text-white`}
            disabled={isLoading}
          />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {isValid === null ? null : isValid ? (
              <span className="text-lg text-badge-success">✅</span>
            ) : (
              <span className="text-lg text-badge-danger">❌</span>
            )}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isValid || isLoading}
          className={`w-full mt-4 py-4 px-6 text-lg font-semibold rounded-xl transition-all duration-200 ${
            isValid && !isLoading
              ? 'bg-badge-primary hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-base-gray-300 dark:bg-base-gray-600 text-base-gray-500 dark:text-base-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Analyzing Wallet...
            </div>
          ) : (
            'Analyze Trust Score'
          )}
        </motion.button>
      </form>

      {address && isValid === false && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span className="text-sm">⚠️</span>
            <span className="text-sm">
              Please enter a valid Ethereum address (0x...) or Basename (.base.eth)
            </span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 