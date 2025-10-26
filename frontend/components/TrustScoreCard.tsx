'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { UserAvatar } from './UserAvatar'
import { Avatar as OnchainAvatar } from '@coinbase/onchainkit/identity'
import { base as baseChain } from 'viem/chains'
import MagicBento from './MagicBento'
import TiltedCard from './TiltedCard'
import { useAuth } from '../contexts/AuthContext'

interface TrustScoreCardProps {
  address: string
  totalScore: number
  baseScore: number
  securityScore: number
  base: {
    tx_count: number
    gas_used: number
    current_balance: number
    past_balance: number
    current_streak: number
    max_streak: number
    age_days: number
    base_score: number
  }
  security: {
    risky_tokens: number
    risky_contracts: number
    risky_signs: number
    suspicious_nfts: number
    security_score: number
  }
  profile?: {
    username: string
    avatar: string
    useBasenameProfile: boolean
    basename?: string
    basenameAvatar?: string
  }
  startCollapsed?: boolean
}

export function TrustScoreCard({ 
  address, 
  totalScore, 
  baseScore, 
  securityScore, 
  base, 
  security,
  profile,
  startCollapsed
}: TrustScoreCardProps) {
  // Ensure base and security objects have default values
  const safeBase = base || {
    tx_count: 0,
    gas_used: 0,
    current_balance: 0,
    past_balance: 0,
    current_streak: 0,
    max_streak: 0,
    age_days: 0,
    base_score: 0
  }
  
  const safeSecurity = security || {
    risky_tokens: 0,
    risky_contracts: 0,
    risky_signs: 0,
    suspicious_nfts: 0,
    security_score: 0
  }
  const [isExpanded, setIsExpanded] = useState<boolean>(!(startCollapsed ?? false))

  // If the address changes (new wallet/check), reset expansion to respect startCollapsed
  useEffect(() => {
    setIsExpanded(!(startCollapsed ?? false))
  }, [address, startCollapsed])

  // Auth + API base
  const { token } = useAuth()
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  // Secure CSV download with Authorization header
  async function downloadCsv(
    kind: 'risky_tokens' | 'risky_contracts' | 'risky_signs' | 'suspicious_nfts'
  ) {
    try {
      const res = await fetch(`${api}/csv/${kind}/${address}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`Download failed (${res.status})`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${kind}_${address}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('CSV download error:', e)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-gamefi-yellow'
    if (score >= 60) return 'text-gamefi-blue'
    return 'text-red-400'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <span className="text-3xl text-gamefi-yellow animate-pulse">🏆</span>
    if (score >= 60) return <span className="text-3xl text-gamefi-blue">📈</span>
    return <span className="text-3xl text-red-400">⚠️</span>
  }

  const displayName = profile?.useBasenameProfile && profile?.basename
    ? profile.basename
    : (profile?.username || `${address.slice(0, 6)}...${address.slice(-4)}`)

  return (
    <div className="w-full space-y-6">
      {/* First TiltedCard - Header + Score Cards */}
      <TiltedCard
        imageSrc="/api/placeholder/800/400?text=Main+Score+Card&bg=0f172a&color=ffffff"
        altText="Main Score Card"
        captionText="Main Card"
        containerHeight="auto"
        containerWidth="100%"
        imageHeight="400px"
        imageWidth="800px"
        rotateAmplitude={6}
        scaleOnHover={1.01}
        showMobileWarning={false}
        showTooltip={false}
        displayOverlayContent={false}
      >
        <div className="relative z-10 w-full h-full bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-gray-700/50 transition-all duration-300 hover:border-gray-600/50">
          {/* Header Section with Enhanced Profile */}
          <motion.div 
            className="flex items-center justify-between mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="flex items-center gap-4">
              {/* User Profile Image */}
              {profile?.useBasenameProfile && !profile?.basenameAvatar ? (
                <div className="relative inline-block">
                  <OnchainAvatar address={address as `0x${string}`} chain={baseChain} />
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-gamefi-black flex items-center justify-center shadow-lg">
                    <span className="text-white text-[10px] leading-none font-bold">✓</span>
                  </div>
                </div>
              ) : (
                <UserAvatar src={(profile?.useBasenameProfile && profile?.basenameAvatar) ? profile.basenameAvatar as string : (profile?.avatar || '/default-avatar.svg')} alt="Profile" size={64} showStatusDot={false} showBasenameBadge={!!profile?.useBasenameProfile} />
              )}
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gamefi-blue via-purple-500 to-gamefi-yellow bg-clip-text text-transparent">
                  {displayName}
                </h2>
                <p className="text-gray-300 text-lg font-medium">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </p>
              </div>
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 200 }}
            >
              {getScoreIcon(totalScore)}
            </motion.div>
          </motion.div>

          {/* Enhanced Score Cards with MagicBento */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <MagicBento
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={true}
              enableMagnetism={true}
              clickEffect={true}
              glowColor="0, 82, 255"
              spotlightRadius={300}
              particleCount={6}
            >
              {/* Total Score Card */}
              <div className="card flex flex-col justify-center relative aspect-[3/2] min-h-[150px] w-full max-w-full p-6 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] card--border-glow bg-gradient-to-br from-gamefi-blue/30 via-purple-600/20 to-gamefi-yellow/30">
                <div className="card__content flex flex-col relative text-center">
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-br from-gamefi-blue via-purple-500 to-gamefi-yellow bg-clip-text text-transparent">
                    {totalScore}
                  </div>
                  <div className="text-lg font-semibold text-white opacity-90">Total Score</div>
                </div>
              </div>

              {/* Base Score Card */}
              <div className="card flex flex-col justify-center relative aspect-[3/2] min-h-[150px] w-full max-w-full p-6 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] card--border-glow bg-gradient-to-br from-gamefi-blue/30 via-indigo-600/20 to-purple-600/30">
                <div className="card__content flex flex-col relative text-center">
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-br from-gamefi-blue via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                    {baseScore}
                  </div>
                  <div className="text-lg font-semibold text-white opacity-90">Base Score</div>
                </div>
              </div>

              {/* Security Score Card */}
              <div className="card flex flex-col justify-center relative aspect-[3/2] min-h-[150px] w-full max-w-full p-6 rounded-[20px] border border-solid font-light overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] card--border-glow bg-gradient-to-br from-gamefi-yellow/30 via-orange-500/20 to-gamefi-accent/30">
                <div className="card__content flex flex-col relative text-center">
                  <div className="text-5xl font-bold mb-2 bg-gradient-to-br from-gamefi-yellow via-orange-500 to-gamefi-accent bg-clip-text text-transparent">
                    {securityScore}
                  </div>
                  <div className="text-lg font-semibold text-white opacity-90">Security Score</div>
                </div>
              </div>
            </MagicBento>
          </motion.div>
        </div>
      </TiltedCard>

      {/* Collapsible Additional TiltedCards */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="space-y-6"
          >
            {/* Second TiltedCard - Base Metrics */}
            <TiltedCard
              imageSrc="/api/placeholder/800/300?text=Base+Metrics&bg=1e3a8a&color=ffffff"
              altText="Base Metrics"
              captionText="Base Metrics"
              containerHeight="auto"
              containerWidth="100%"
              imageHeight="300px"
              imageWidth="800px"
              rotateAmplitude={4}
              scaleOnHover={1.01}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={false}
            >
              <div className="relative z-10 w-full h-full bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-700/50 transition-all duration-300 hover:border-gray-600/50">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-3xl text-gamefi-blue animate-pulse">⚔️</span>
                  <span className="bg-gradient-to-r from-gamefi-blue to-purple-500 bg-clip-text text-transparent">
                    Base Metrics
                  </span>
                </h3>
                
                {/* Base Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 p-4 rounded-xl border border-blue-700/40 hover:border-blue-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">{safeBase.tx_count}</div>
                      <div className="text-sm text-blue-200">Transactions</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 p-4 rounded-xl border border-purple-700/40 hover:border-purple-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">{safeBase.current_streak}</div>
                      <div className="text-sm text-purple-200">Current Streak</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/40 to-green-800/30 p-4 rounded-xl border border-green-700/40 hover:border-green-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-500/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">{safeBase.age_days}</div>
                      <div className="text-sm text-green-200">Age (Days)</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 p-4 rounded-xl border border-red-700/40 hover:border-red-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400 mb-1">{safeBase.current_balance.toFixed(2)}</div>
                      <div className="text-sm text-red-200">Balance (USDC)</div>
                    </div>
                  </div>
                </div>
                
                {/* Second Row - Centered with 3 cards */}
                <div className="flex justify-center">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/30 p-4 rounded-xl border border-orange-700/40 hover:border-orange-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20">
                      <div className="text-center">
                        <div className="text-xl font-bold text-orange-400 mb-1 leading-tight">
                          {(() => {
                            const gasInWei = safeBase.gas_used;
                            if (gasInWei >= 1000000000000000000) {
                              // Convert from wei to ETH (divide by 10^18)
                              const gasInEth = gasInWei / 1000000000000000000;
                              if (gasInEth >= 1) {
                                return `${gasInEth.toFixed(0)} Gwei`;
                              } else {
                                return `${(gasInEth * 1000).toFixed(0)} mGwei`;
                              }
                            } else if (gasInWei >= 1000000000000000) {
                              // Show in mETH for smaller amounts
                              return `${(gasInWei / 1000000000000000).toFixed(0)} mGwei`;
                            } else {
                              return gasInWei.toLocaleString();
                            }
                          })()}
                        </div>
                        <div className="text-sm text-orange-200">Gas Used</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/30 p-4 rounded-xl border border-blue-700/40 hover:border-blue-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">{safeBase.max_streak}</div>
                        <div className="text-sm text-blue-200">Max Streak</div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-pink-900/40 to-pink-800/30 p-4 rounded-xl border border-pink-700/40 hover:border-pink-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-pink-500/20">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-pink-400 mb-1">{safeBase.past_balance.toFixed(2)}</div>
                        <div className="text-sm text-pink-200">Past Balance</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TiltedCard>

            {/* Third TiltedCard - Security Analysis */}
            <TiltedCard
              imageSrc="/api/placeholder/800/300?text=Security+Analysis&bg=dc2626&color=ffffff"
              altText="Security Analysis"
              captionText="Security Analysis"
              containerHeight="auto"
              containerWidth="100%"
              imageHeight="300px"
              imageWidth="800px"
              rotateAmplitude={4}
              scaleOnHover={1.01}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent={false}
            >
              <div className="relative z-10 w-full h-full bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 border border-gray-700/50 transition-all duration-300 hover:border-gray-600/50">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-3xl text-gamefi-yellow animate-pulse">🛡️</span>
                  <span className="bg-gradient-to-r from-gamefi-yellow to-orange-500 bg-clip-text text-transparent">
                    Security Analysis
                  </span>
                </h3>
                
                {/* Security Metrics Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 p-4 rounded-xl border border-red-700/40 hover:border-red-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-red-400 mb-1">{safeSecurity.risky_tokens}</div>
                      <div className="text-sm text-red-200">Risky Tokens</div>
                    </div>
                    <button
                      onClick={() => downloadCsv('risky_tokens')}
                      className="block w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-center"
                    >
                      📥 Download CSV
                  </button>
                  </div>

                  <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/30 p-4 rounded-xl border border-orange-700/40 hover:border-orange-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-orange-400 mb-1">{safeSecurity.risky_contracts}</div>
                      <div className="text-sm text-orange-200">Risky Contracts</div>
                    </div>
                    <button
                      onClick={() => downloadCsv('risky_contracts')}
                      className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-center"
                    >
                      📥 Download CSV
                  </button>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/30 p-4 rounded-xl border border-yellow-700/40 hover:border-yellow-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">{safeSecurity.risky_signs}</div>
                      <div className="text-sm text-yellow-200">Risky Signs</div>
                    </div>
                    <button
                      onClick={() => downloadCsv('risky_signs')}
                      className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-center"
                    >
                      📥 Download CSV
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-red-900/40 to-red-800/30 p-4 rounded-xl border border-red-700/40 hover:border-red-600/60 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20">
                    <div className="text-center mb-3">
                      <div className="text-2xl font-bold text-red-400 mb-1">{safeSecurity.suspicious_nfts}</div>
                      <div className="text-sm text-red-200">Suspicious NFTs</div>
                    </div>
                    <button
                      onClick={() => downloadCsv('suspicious_nfts')}
                      className="block w-full bg-red-600 hover:bg-red-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors duration-200 text-center"
                    >
                      📥 Download CSV
                    </button>
                  </div>
                </div>
                
              </div>
            </TiltedCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single Dynamic Button at the very end */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 15px 35px rgba(0,0,0,0.4)"
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`group relative px-10 py-4 rounded-2xl font-medium transition-all duration-500 overflow-hidden ${
            isExpanded 
              ? "bg-gradient-to-r from-gray-700/80 to-gray-800/80 text-gray-100 border border-gray-600/50 hover:border-gray-500/50" 
              : "bg-gradient-to-r from-gamefi-blue/30 to-purple-600/30 text-white border border-gamefi-blue/40 hover:border-gamefi-blue/60"
          } backdrop-blur-sm`}
        >
          <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
            isExpanded 
              ? "bg-gradient-to-r from-gamefi-blue/20 to-purple-600/20" 
              : "bg-gradient-to-r from-gamefi-blue/40 to-purple-600/40"
          }`} />
          
          <span className="relative flex items-center gap-3">
            <motion.div
              animate={{ 
                rotate: isExpanded ? 180 : 0,
                y: isExpanded ? 0 : [0, -3, 0]
              }}
              transition={{ 
                rotate: { duration: 0.5, ease: "easeInOut" },
                y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
              className={`text-xl transition-colors duration-300 ${
                isExpanded 
                  ? "text-gamefi-blue group-hover:text-purple-400" 
                  : "text-gamefi-blue group-hover:text-purple-400"
              }`}
            >
              {isExpanded ? "↑" : "↓"}
            </motion.div>
            
            <span className={`bg-clip-text text-transparent transition-all duration-300 ${
              isExpanded 
                ? "bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-white group-hover:to-gray-100" 
                : "bg-gradient-to-r from-gamefi-blue to-purple-500 group-hover:from-white group-hover:to-gray-100"
            }`}>
              {isExpanded ? "Show Less" : "Show More"}
            </span>
          </span>
        </motion.button>
      </div>
    </div>
  )
} 