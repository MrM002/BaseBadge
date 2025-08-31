'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useScore } from '../../contexts/ScoreContext'
import Image from 'next/image'
import DarkVeil from '../../components/DarkVeil'
import ProfileCard from '../../components/ProfileCard'
import ProfileManager, { UserProfile } from '../../utils/profileManager'

interface ScoreData {
  total_score: number
  base_score: number
  security_score: number
  date: string
}

interface BadgeData {
  id: string
  name: string
  icon: string
  description: string
  earned: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const { lastScores, scoreHistory, badges, isLoading, error, refreshScores } = useScore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showBasePopup, setShowBasePopup] = useState(false)
  const [showHeartBurst, setShowHeartBurst] = useState(false)

  // CRITICAL: Load profile ONLY after confirmed Score Card transaction from on-chain
  useEffect(() => {
    if (isConnected && address && lastScores && lastScores.total_score > 0) {
      console.log('✅ Loading profile after confirmed Score Card transaction from on-chain')
      loadProfile()
    } else {
      console.log('🚫 Profile loading blocked - no confirmed Score Card transaction from on-chain')
      setProfile(null) // Clear any existing profile data
    }
  }, [isConnected, address, lastScores])

  // Load profile data using ProfileManager
  const loadProfile = async () => {
    if (!address) return
    try {
      const loadedProfile = await ProfileManager.loadProfile(address)
      setProfile(loadedProfile)
      console.log('✅ Profile loaded for dashboard:', loadedProfile)
    } catch (error) {
      console.error('💥 Failed to load profile:', error)
      // Set default profile on error
      setProfile({
        username: '',
        avatar: '/default-avatar.svg',
        useBasenameProfile: false,
        basename: undefined,
        basenameAvatar: undefined,
      })
    }
  }

  // Listen for profile updates from settings page
  useEffect(() => {
    const onProfileUpdated = () => {
      console.log('🔄 Profile updated, reloading...')
      if (isConnected && address && lastScores && lastScores.total_score > 0) {
        loadProfile()
      }
    }
    
    const onProfileDataUpdated = (event: CustomEvent) => {
      if (event.detail?.address === address) {
        console.log('🔄 Profile data updated, updating immediately:', event.detail.profile)
        const updatedProfile = event.detail.profile
        setProfile(updatedProfile)
      }
    }
    
    window.addEventListener('profile-updated', onProfileUpdated as EventListener)
    window.addEventListener('profile-data-updated', onProfileDataUpdated as EventListener)
    
    return () => {
      window.removeEventListener('profile-updated', onProfileUpdated as EventListener)
      window.removeEventListener('profile-data-updated', onProfileDataUpdated as EventListener)
    }
  }, [isConnected, address, lastScores])

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 80) return 'text-yellow-400'
    if (score >= 70) return 'text-orange-400'
    return 'text-red-400'
  }

  const navigateToScoreCard = () => {
    console.log('🚀 Navigating to Score Card page...')
    router.push('/dashboard/score-card')
  }

  const handleBaseHeartClick = () => {
    // Trigger heart burst animation
    setShowHeartBurst(true)
    
    // Heart burst animation completes, no need for Base popup anymore
    
    // Reset heart burst state
    setTimeout(() => setShowHeartBurst(false), 1500)
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Good'
    if (score >= 70) return 'Fair'
    return 'Poor'
  }

  // Fixed preview badges (will align with backend ids)
  const previewBadgeDefs: Record<string, { id: string; name: string; icon: string; description: string }> = {
    first_score: {
      id: 'first_score',
      name: 'First Score',
      icon: '🎯',
      description: 'Calculated your first wallet score',
    },
    tx_10: {
      id: 'tx_10',
      name: 'Onboarded',
      icon: '🚀',
      description: 'Completed at least 10 transactions',
    },
    tx_100: {
      id: 'tx_100',
      name: 'Active User',
      icon: '⚡',
      description: 'Completed at least 100 transactions',
    },
    security_guard: {
      id: 'security_guard',
      name: 'Security Guard',
      icon: '🛡️',
      description: 'Security score in acceptable range',
    },
  }

  const previewBadges: BadgeData[] = [
    previewBadgeDefs.first_score,
    previewBadgeDefs.tx_10,
    previewBadgeDefs.tx_100,
    previewBadgeDefs.security_guard,
  ].map(def => {
    const found = badges.find((b: BadgeData) => b.id === def.id)
    return {
      id: def.id,
      name: def.name,
      icon: def.icon,
      description: def.description,
      earned: !!found?.earned,
    }
  })

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">Please connect your wallet</h2>
        </div>
      </div>
    )
  }

  if (isLoading && !lastScores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gamefi-yellow mx-auto mb-4"></div>
          <h2 className="text-2xl text-white mb-4">Loading your dashboard...</h2>
        </div>
      </div>
    )
  }

  // Instead of showing a separate error page, we'll show the dashboard with error state
  // This ensures users stay on the dashboard even when there are backend connectivity issues


  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <DarkVeil 
          hueShift={0}
          noiseIntensity={0.02}
          scanlineIntensity={0.2}
          speed={1.4}
          scanlineFrequency={0.8}
          warpAmount={1.5}
          resolutionScale={1}
        />
      </div>
      
      {/* Error notification banner if there's an error but we're still showing the dashboard */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/40 rounded-lg mx-auto max-w-4xl mt-4 p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-white">{error}</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={refreshScores}
              className="bg-blue-500/30 hover:bg-blue-500/50 text-white px-3 py-1 rounded-md transition-colors"
            >
              🔄 Retry
            </button>
            <button 
              onClick={navigateToScoreCard}
              className="bg-green-500/30 hover:bg-green-500/50 text-white px-3 py-1 rounded-md transition-colors"
            >
              Get Score Card
            </button>
          </div>
        </motion.div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Bm<span 
              onClick={handleBaseHeartClick}
              className="inline-block cursor-pointer hover:scale-110 transition-transform duration-200 hover:animate-pulse"
              title="Click for Base info!"
            >💙</span>
          </h1>
          <p className="text-gray-400 text-lg">
            {lastScores && lastScores.total_score > 0 
              ? 'Here\'s your wallet reputation overview' 
              : 'Complete a Score Card transaction to see your reputation'
            }
          </p>
        </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card Section - Only show after confirmed Score Card transaction */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          {lastScores && lastScores.total_score > 0 ? (
            <ProfileCard
              address={address}
              totalScore={lastScores.total_score}
              baseScore={lastScores.base_score}
              securityScore={lastScores.security_score}
              iconUrl="/logo.png"
              enableTilt={true}
              enableMobileTilt={false}
              profile={profile || undefined}
            />
          ) : (
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-2xl shadow-black/50 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">No Score Data</h3>
              <p className="text-gray-400 mb-4">Complete a Score Card transaction to see your reputation</p>
              <button 
                onClick={navigateToScoreCard}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
              >
                Get Score Card
              </button>
            </div>
          )}
        </motion.div>

        {/* Badge Section - Only show after confirmed Score Card transaction */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 lg:col-start-2"
        >
          {lastScores && lastScores.total_score > 0 ? (
            <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-2xl shadow-black/50 relative overflow-hidden">
            {/* Background logo like ProfileCard */}
            <div className="absolute inset-0 opacity-[0.03] -z-10">
              <div className="absolute -rotate-[15deg] right-[-30px] bottom-[60px]">
                <div className="w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full blur-xl"></div>
              </div>
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600/40 to-slate-700/60 rounded-xl flex items-center justify-center border border-slate-500/30">
                  <span className="text-xl opacity-80">🏆</span>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  Badges
                </h2>
              </div>
              
              {/* Preview Label */}
              <div className="px-3 py-1.5 bg-gradient-to-r from-slate-600/30 to-slate-700/40 rounded-full border border-slate-500/20">
                <span className="text-xs font-medium text-gray-400 opacity-70">Preview</span>
              </div>
            </div>
            
            {/* Badge Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {previewBadges.map((badge) => (
                <motion.div
                  key={badge.id}
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  className={`group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                    badge.earned 
                      ? 'bg-gradient-to-br from-slate-700/50 via-slate-600/40 to-slate-700/50 border-slate-500/40 shadow-lg shadow-slate-500/20 hover:shadow-slate-500/30 hover:border-slate-400/50' 
                      : 'bg-gradient-to-br from-slate-800/40 via-slate-700/30 to-slate-800/40 border-slate-600/30 opacity-70 hover:opacity-90'
                  }`}
                >
                  {/* Badge Icon */}
                  <div className="text-center mb-3">
                    <div className={`text-2xl lg:text-3xl mb-2 relative inline-block transition-transform duration-300 group-hover:scale-110 ${
                      badge.earned ? 'animate-pulse' : ''
                    }`}>
                      <span>{badge.icon}</span>
                      {!badge.earned && (
                        <span className="absolute -top-2 -right-3 text-xs lg:text-sm opacity-80">🔒</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Badge Info */}
                  <div className="text-center">
                    <h3 className={`text-xs lg:text-sm font-semibold mb-1 ${
                      badge.earned ? 'text-white' : 'text-gray-400'
                    }`}>
                      {badge.name}
                    </h3>
                    <p className={`text-xs leading-relaxed ${
                      badge.earned ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {badge.description}
                    </p>
                    
                    {/* Earned Status */}
                    {badge.earned && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-3"
                      >
                        <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-3 py-1.5 rounded-full font-semibold shadow-lg shadow-yellow-500/25">
                          ✓ Earned
                        </span>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Hover Effect */}
                  {badge.earned && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Footer Message */}
            <div className="p-4 bg-gradient-to-r from-slate-700/30 via-slate-600/20 to-slate-700/30 rounded-xl border border-slate-500/20 shadow-inner">
              <p className="text-sm text-gray-300 text-center leading-relaxed">
                🎮 <span className="font-medium">Full badge system is coming soon.</span> This is a preview of a few badges.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-950/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl p-6 shadow-2xl shadow-black/50 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">No Badges Yet</h3>
            <p className="text-gray-400 mb-4">Complete a Score Card transaction to unlock badges</p>
          </div>
        )}
        </motion.div>
      </div>

      {/* Page helper box - improved design */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-8 max-w-4xl mx-auto p-6 bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-950/60 border border-slate-600/30 rounded-2xl text-gray-200 shadow-2xl shadow-black/30 backdrop-blur-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <span className="text-xl">📘</span>
          </div>
          <div className="flex-1">
            <h3 className="mb-3 text-lg font-semibold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              How this page works
            </h3>
            <p className="text-sm leading-relaxed text-gray-300">
              This dashboard summarizes your latest score, badge previews, and progress. Use the sidebar to jump to Score Card for new checks or to the Badge page. Settings are available from the header.
            </p>
          </div>
        </div>
      </motion.div>
      </div>

      {/* Heart Burst Animation */}
      <AnimatePresence>
        {showHeartBurst && (
          <>
            {/* Heart 1 - Top Right */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0, 
                x: 0, 
                y: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.2, 0.8], 
                x: [0, 80, 120], 
                y: [0, -60, -100],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 1.8,
                ease: "easeOut"
              }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: 'calc(50% - 700px)', // Left side of ProfileCard
                top: 'calc(50% - 250px)'   // Center of ProfileCard
              }}
            >
              <div className="text-2xl opacity-60 text-blue-400">💙</div>
            </motion.div>

            {/* Heart 2 - Top Left */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0, 
                x: 0, 
                y: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.2, 0.8], 
                x: [0, -80, -120], 
                y: [0, -60, -100],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 1.8,
                ease: "easeOut",
                delay: 0.1
              }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: 'calc(50% - 700px)', // Left side of ProfileCard
                top: 'calc(50% - 250px)'   // Center of ProfileCard
              }}
            >
              <div className="text-2xl opacity-60 text-blue-400">💙</div>
            </motion.div>

            {/* Heart 3 - Bottom Right */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0, 
                x: 0, 
                y: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.2, 0.8], 
                x: [0, 80, 120], 
                y: [0, 60, 100],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 1.8,
                ease: "easeOut",
                delay: 0.2
              }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: 'calc(50% - 700px)', // Left side of ProfileCard
                top: 'calc(50% - 250px)'   // Center of ProfileCard
              }}
            >
              <div className="text-2xl opacity-60 text-blue-400">💙</div>
            </motion.div>

            {/* Heart 4 - Bottom Left */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0, 
                x: 0, 
                y: 0,
                rotate: 0
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.2, 0.8], 
                x: [0, -80, -120], 
                y: [0, 60, 100],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 1.8,
                ease: "easeOut",
                delay: 0.3
              }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: 'calc(50% - 700px)', // Left side of ProfileCard
                top: 'calc(50% - 250px)'   // Center of ProfileCard
              }}
            >
              <div className="text-2xl opacity-60 text-blue-400">💙</div>
            </motion.div>

            {/* Based Text - Center */}
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0,
                y: 0
              }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.5, 1],
                y: [0, -20, -40]
              }}
              transition={{ 
                duration: 1.8,
                ease: "easeOut",
                delay: 0.4
              }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: 'calc(50% - 700px)', // Left side of ProfileCard
                top: 'calc(50% - 250px)'   // Center of ProfileCard
              }}
            >
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent opacity-80">
                Based
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </div>
  )
} 