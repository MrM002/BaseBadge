'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConnect } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

interface CustomWalletButtonProps {
  children: React.ReactNode
  className?: string
}

export function CustomWalletButton({ children, className }: CustomWalletButtonProps) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const [showModal, setShowModal] = useState(false)



  // Redirect to dashboard when wallet is connected
  useEffect(() => {
    if (isConnected && address) {
      console.log('Wallet connected, redirecting to dashboard:', address)
      setShowModal(false)
      router.push('/dashboard')
    }
  }, [isConnected, address, router])

  const handleClick = () => {
    setShowModal(true)
  }

  const handleWalletSelect = (connector: any) => {
    console.log('Connecting to:', connector.name)
    connect({ connector })
    setShowModal(false)
  }

  // Manual wallet detection
  const detectWallets = () => {
    const wallets = []
    
    // Check for MetaMask
    if (typeof window !== 'undefined' && window.ethereum) {
      wallets.push({
        id: 'metamask',
        name: 'MetaMask',
        icon: 'MM',
        color: 'orange'
      })
    }
    
    // Check for Coinbase Wallet - improved detection
    if (typeof window !== 'undefined') {
      // Check for Coinbase Wallet extension
      if (window.ethereum?.isCoinbaseWallet) {
        wallets.push({
          id: 'coinbase',
          name: 'Coinbase Wallet',
          icon: 'CB',
          color: 'blue'
        })
      }
      // Also check for Coinbase Wallet in providers
      else if (window.ethereum?.providers) {
        const coinbaseProvider = window.ethereum.providers.find(
          (provider: any) => provider.isCoinbaseWallet
        )
        if (coinbaseProvider) {
          wallets.push({
            id: 'coinbase',
            name: 'Coinbase Wallet',
            icon: 'CB',
            color: 'blue'
          })
        }
      }
      // Check for Coinbase Wallet in window object
      else if ((window as any).coinbaseWalletExtension) {
        wallets.push({
          id: 'coinbase',
          name: 'Coinbase Wallet',
          icon: 'CB',
          color: 'blue'
        })
      }
      // Check for Coinbase Wallet in ethereum object with different property names
      else if (window.ethereum && (window.ethereum as any).isCoinbaseWallet) {
        wallets.push({
          id: 'coinbase',
          name: 'Coinbase Wallet',
          icon: 'CB',
          color: 'blue'
        })
      }
      // Additional checks for Coinbase Wallet
      else if (window.ethereum && (window.ethereum as any).isCoinbaseWallet === true) {
        wallets.push({
          id: 'coinbase',
          name: 'Coinbase Wallet',
          icon: 'CB',
          color: 'blue'
        })
      }

    }
    

    
    return wallets
  }

  // Show all available connectors and reorder them
  const availableConnectors = connectors
    .filter(connector => connector.ready)
    .sort((a, b) => {
      // Coinbase Wallet first, then MetaMask, then others
      if (a.name === 'Coinbase Wallet') return -1
      if (b.name === 'Coinbase Wallet') return 1
      if (a.name === 'MetaMask') return -1
      if (b.name === 'MetaMask') return 1
      return 0
    })



  // Fallback to manual detection if no connectors are ready
  const detectedWallets = detectWallets().sort((a, b) => {
    // Coinbase Wallet first, then MetaMask
    if (a.name === 'Coinbase Wallet') return -1
    if (b.name === 'Coinbase Wallet') return 1
    if (a.name === 'MetaMask') return -1
    if (b.name === 'MetaMask') return 1
    return 0
  })

  const getWalletIcon = (connectorName: string) => {
    switch (connectorName) {
      case 'Coinbase Wallet':
        return (
          <Image
            src="/coinbase-wallet.svg"
            alt="Coinbase Wallet"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        )
      case 'MetaMask':
        return (
          <Image
            src="/metamask.svg"
            alt="MetaMask"
            width={24}
            height={24}
            className="w-6 h-6"
          />
        )
      default:
        return (
          <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">{connectorName.charAt(0)}</span>
          </div>
        )
    }
  }

  const handleManualWalletSelect = (wallet: any) => {
    // Try to connect using the appropriate connector
    const connector = connectors.find(c => 
      c.name.toLowerCase().includes(wallet.name.toLowerCase())
    )
    if (connector) {
      connect({ connector })
    } else if (wallet.name === 'Coinbase Wallet') {
      // Special handling for Coinbase Wallet fallback
      const coinbaseConnector = connectors.find(c => c.name === 'Coinbase Wallet')
      if (coinbaseConnector) {
        connect({ connector: coinbaseConnector })
      } else {
        // Try to manually trigger Coinbase Wallet
        if (typeof window !== 'undefined' && window.ethereum) {
          window.ethereum.request({ method: 'eth_requestAccounts' })
            .then((accounts: any) => {
              // Handle successful connection
            })
            .catch((error: any) => {
              // Handle connection error
            })
          }
      }
    }
    setShowModal(false)
  }

  return (
    <>
      <div className="text-center">
        <div
          className="relative inline-block"
          onMouseEnter={(e) => {
            const overlay = e.currentTarget.querySelector('.glare-overlay') as HTMLElement
            if (overlay) {
              overlay.style.transition = 'none'
              overlay.style.backgroundPosition = '-100% -100%, 0 0'
              overlay.style.transition = '1200ms ease'
              overlay.style.backgroundPosition = '100% 100%, 0 0'
            }
          }}
          onMouseLeave={(e) => {
            const overlay = e.currentTarget.querySelector('.glare-overlay') as HTMLElement
            if (overlay) {
              overlay.style.transition = '1200ms ease'
              overlay.style.backgroundPosition = '-100% -100%, 0 0'
            }
          }}
        >
          <motion.button
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 0 20px rgba(255, 184, 0, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            className={className}
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {children}
            <div 
              className="glare-overlay absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(-30deg,
                  hsla(0,0%,0%,0) 60%,
                  rgba(0, 82, 255, 0.8) 70%,
                  hsla(0,0%,0%,0) 100%)`,
                backgroundSize: '500% 500%, 100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: '-100% -100%, 0 0',
                transition: '1200ms ease'
              }}
            />
          </motion.button>
        </div>
      </div>

      {/* Custom Wallet Selection Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-400">
                  Choose your preferred wallet to connect
                </p>
              </div>

              <div className="space-y-4">
                {/* Show all available wallets in a single clean list */}
                {(() => {
                  // Combine available connectors and detected wallets, removing duplicates
                  const allWallets: Array<{
                    id: string
                    name: string
                    type: 'connector' | 'detected'
                    connector?: any
                    wallet?: any
                  }> = []
                  
                  // Add available connectors first
                  availableConnectors.forEach(connector => {
                    allWallets.push({
                      id: connector.id,
                      name: connector.name,
                      type: 'connector',
                      connector: connector
                    })
                  })
                  
                  // Add detected wallets that aren't already in connectors
                  detectedWallets.forEach(wallet => {
                    const exists = allWallets.some(w => w.name === wallet.name)
                    if (!exists) {
                      allWallets.push({
                        id: wallet.id,
                        name: wallet.name,
                        type: 'detected',
                        wallet: wallet
                      })
                    }
                  })
                  
                  // Ensure Coinbase Wallet is always available if not already present
                  if (!allWallets.some(w => w.name === 'Coinbase Wallet')) {
                    allWallets.push({
                      id: 'coinbase-fallback',
                      name: 'Coinbase Wallet',
                      type: 'detected',
                      wallet: { id: 'coinbase', name: 'Coinbase Wallet', icon: 'CB', color: 'blue' }
                    })
                  }
                  
                  // If no wallets found, show installation options
                  if (allWallets.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">No wallets detected</p>
                        <div className="space-y-3">
                          <a 
                            href="https://www.coinbase.com/wallet" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-semibold"
                          >
                            <Image
                              src="/coinbase-wallet.svg"
                              alt="Coinbase Wallet"
                              width={24}
                              height={24}
                              className="w-6 h-6"
                            />
                            Install Coinbase Wallet
                          </a>
                          <a 
                            href="https://metamask.io/download/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="block p-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-semibold"
                          >
                            <Image
                              src="/metamask.svg"
                              alt="MetaMask"
                              width={24}
                              height={24}
                              className="w-6 h-6"
                            />
                            Install MetaMask
                          </a>
                        </div>
                      </div>
                    )
                  }
                  
                  // Show all wallets in a clean list
                  return allWallets.map((wallet) => (
                    <motion.button
                      key={wallet.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (wallet.type === 'connector') {
                          handleWalletSelect(wallet.connector)
                        } else {
                          handleManualWalletSelect(wallet.wallet)
                        }
                      }}
                      className="w-full p-4 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-700 hover:border-gamefi-yellow/50 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-white font-semibold"
                    >
                      {getWalletIcon(wallet.name)}
                      {wallet.name}
                    </motion.button>
                  ))
                })()}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(false)}
                className="w-full mt-6 p-3 text-gray-400 hover:text-white transition-colors duration-300"
              >
                Cancel
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 