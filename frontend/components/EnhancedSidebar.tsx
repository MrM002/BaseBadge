'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { UserAvatar } from './UserAvatar'
import { Avatar as OnchainAvatar } from '@coinbase/onchainkit/identity'
import { base } from 'viem/chains'

interface EnhancedSidebarProps {
  isOpen: boolean
  onClose: () => void
  userProfile: {
    username: string
    avatar: string
    basename: string
    basenameAvatar: string | undefined
  }
  address: string | undefined
  pathname: string
  onMenuClick: (path: string) => void
}

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Score Card', path: '/dashboard/score-card', icon: '🎯' },
  { name: 'Badge', path: '/dashboard/badge', icon: '🏆' }
]

export default function EnhancedSidebar({
  isOpen,
  onClose,
  userProfile,
  address,
  pathname,
  onMenuClick
}: EnhancedSidebarProps) {
  // Get user display name (respect useBasenameProfile via stored basename)
  const getUserDisplayName = () => {
    if (userProfile.basename) return userProfile.basename
    if (userProfile.username) return userProfile.username
    if (address) return `${address.slice(0, 6)}...${address.slice(-4)}`
    return 'User'
  }

  // Different gradient colors for each menu item
  const getActiveGradient = (itemName: string) => {
    switch (itemName) {
      case 'Dashboard':
        return 'from-emerald-500 via-teal-500 to-cyan-500'
      case 'Score Card':
        return 'from-blue-500 via-indigo-500 to-purple-500'
      case 'Badge':
        return 'from-purple-500 via-pink-500 to-rose-500'
      default:
        return 'from-emerald-500 via-teal-500 to-cyan-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Enhanced Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm backdrop-saturate-150 z-40"
          />
          
          {/* Enhanced Sidebar */}
          <motion.aside
            initial={{ x: -400, scale: 0.95, opacity: 0 }}
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={{ x: -400, scale: 0.95, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 200, 
              duration: 0.6 
            }}
            className="fixed left-0 top-0 h-full w-80 bg-gradient-to-b from-gamefi-black via-gray-900 to-gamefi-dark-blue border-r border-purple-800/50 z-50 shadow-2xl overflow-hidden"
          >
            <div className="flex flex-col h-full relative">
              {/* Enhanced Close Button */}
              <div className="absolute top-3 right-3 z-[60]">
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 180 }}
                  whileTap={{ scale: 0.85 }}
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/50 shadow-lg"
                  aria-label="Close menu"
                >
                  ✕
                </motion.button>
              </div>

              {/* Enhanced Logo Background */}
              <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.08] -z-10">
                <div className="absolute -rotate-[15deg] right-[-20px] bottom-[40px]">
                  <Image src="/logo.png" alt="" width={420} height={130} className="select-none opacity-90" />
                </div>
              </div>

              {/* Enhanced User Profile Section */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-pink-900/40 border-b border-purple-800/50 rounded-b-2xl"
              >
                <div className="flex items-center gap-4">
                  {userProfile.basename && !userProfile.basenameAvatar ? (
                    <div className="relative inline-block">
                      <OnchainAvatar address={address as `0x${string}`} chain={base} />
                      <div className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 border-2 border-gamefi-black flex items-center justify-center shadow-md">
                        <span className="text-white text-[10px] leading-none">✓</span>
                      </div>
                    </div>
                  ) : (
                    <UserAvatar
                      src={userProfile.basename ? (userProfile.basenameAvatar || userProfile.avatar) : userProfile.avatar}
                      alt="Profile"
                      size={60}
                      showStatusDot={false}
                      showBasenameBadge={!!userProfile.basename}
                    />
                  )}
                  <div className="flex-1">
                    <motion.h3 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-white font-semibold text-lg"
                    >
                      {getUserDisplayName()}
                    </motion.h3>
                    <motion.p 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-gray-400 text-sm"
                    >
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Navigation Menu */}
              <nav className="flex-1 p-6 relative">
                <ul className="space-y-3">
                  {menuItems.map((item, index) => {
                    const isActive = pathname === item.path
                    
                    return (
                      <motion.li 
                        key={item.path}
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + (index * 0.1) }}
                      >
                        <motion.button
                          whileHover={{ x: 10, scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => onMenuClick(item.path)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 relative overflow-hidden group ${
                            isActive
                              ? `bg-gradient-to-r ${getActiveGradient(item.name)} text-black font-semibold shadow-lg`
                              : 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-md'
                          }`}
                        >
                          {/* Active Indicator with matching color */}
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              className={`absolute left-3 w-3 h-3 rounded-full bg-white shadow-sm`}
                            />
                          )}
                          
                          {/* Icon with enhanced hover effects */}
                          <motion.span 
                            className="text-xl"
                            whileHover={{ rotate: 5 }}
                          >
                            {item.icon}
                          </motion.span>
                          
                          <span className="text-lg">{item.name}</span>

                          {/* Subtle glow effect for active items */}
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 opacity-20"
                              style={{
                                background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)`
                              }}
                              animate={{
                                backgroundPositionX: ['0%', '200%']
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                            />
                          )}
                        </motion.button>
                      </motion.li>
                    )
                  })}
                </ul>

                {/* Enhanced Diagonal Sweep Effect */}
                <motion.div 
                  aria-hidden 
                  className="pointer-events-none absolute inset-0"
                  style={{ 
                    background: 'linear-gradient(120deg, transparent 0%, rgba(147, 51, 234, 0.08) 40%, rgba(236, 72, 153, 0.08) 50%, transparent 70%)' 
                  }}
                  animate={{ 
                    backgroundPositionX: ['0%', '200%'],
                    opacity: [0.3, 0.7, 0.3]
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity, 
                    ease: 'linear' 
                  }}
                />
              </nav>

              {/* Enhanced Edge Handle */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-20 bg-gradient-to-b from-purple-500/50 via-pink-500/50 to-purple-500/50 rounded-l-full opacity-60" />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
