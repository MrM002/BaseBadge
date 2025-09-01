'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useRouter, usePathname } from 'next/navigation'
import { NotificationBell } from '../../components/NotificationBell'
import { WalletConnect } from '../../components/WalletConnect'
import EnhancedSidebar from '../../components/EnhancedSidebar'
import ProfileManager, { UserProfile } from '../../utils/profileManager'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState({
    username: '',
    avatar: '/default-avatar.svg',
    basename: '',
    basenameAvatar: '' as string | undefined,
  })
  
  const { address, isConnected } = useAccount()
  const router = useRouter()
  const pathname = usePathname()

  // Keep a marker class on <html> for any page-specific tuning if needed
  useEffect(() => {
    const root = document.documentElement
    if (isSidebarOpen) root.classList.add('bb-sidebar-open')
    else root.classList.remove('bb-sidebar-open')
    return () => root.classList.remove('bb-sidebar-open')
  }, [isSidebarOpen])

  // Dispatch a global event so pages (e.g., Score Card) can react for visuals
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('bb-sidebar-toggle', { detail: { open: isSidebarOpen } }))
    } catch {}
  }, [isSidebarOpen])

  // Redirect to home if not connected, but allow settings page to handle its own connection state
  useEffect(() => {
    if (!isConnected) {
      // Prevent redirect loop for settings page by checking pathname
      if (!pathname.includes('/dashboard/settings')) {
        router.push('/')
      }
    }
  }, [isConnected, router, pathname])

  // Load profile using ProfileManager and react to updates
  useEffect(() => {
    const loadProfile = async () => {
      if (!isConnected || !address) return
      
      try {
        const loadedProfile = await ProfileManager.loadProfile(address)
        
        // Convert to sidebar format
        const sidebarProfile = {
          username: loadedProfile.username || '',
          avatar: loadedProfile.avatar || '/default-avatar.svg',
          basename: loadedProfile.useBasenameProfile ? (loadedProfile.basename || '') : '',
          basenameAvatar: loadedProfile.useBasenameProfile ? (loadedProfile.basenameAvatar || undefined) : undefined,
        }
        
        setUserProfile(sidebarProfile)
        console.log('✅ Profile loaded for sidebar:', sidebarProfile)
      } catch (error) {
        console.error('💥 Error loading profile:', error)
      }
    }
    
    loadProfile()

    // Listen for profile updates from settings page
    const onProfileUpdated = () => {
      console.log('🔄 Profile updated, reloading...')
      loadProfile()
    }
    
    // Listen for profile data updates with detailed information
    const onProfileDataUpdated = (event: CustomEvent) => {
      if (event.detail?.address === address) {
        console.log('🔄 Profile data updated, updating immediately:', event.detail.profile)
        const updatedProfile = event.detail.profile
        
        // Convert to sidebar format
        const sidebarProfile = {
          username: updatedProfile.username || '',
          avatar: updatedProfile.avatar || '/default-avatar.svg',
          basename: updatedProfile.useBasenameProfile ? (updatedProfile.basename || '') : '',
          basenameAvatar: updatedProfile.useBasenameProfile ? (updatedProfile.basenameAvatar || undefined) : undefined,
        }
        
        setUserProfile(sidebarProfile)
      }
    }
    
    window.addEventListener('profile-updated', onProfileUpdated as EventListener)
    window.addEventListener('profile-data-updated', onProfileDataUpdated as EventListener)
    
    return () => {
      window.removeEventListener('profile-updated', onProfileUpdated as EventListener)
      window.removeEventListener('profile-data-updated', onProfileDataUpdated as EventListener)
    }
  }, [isConnected, address])

  const handleMenuClick = (path: string) => {
    router.push(path)
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen">
      {/* Floating controls (no full-width header) */}
      <div className="fixed top-3 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.08, rotate: isSidebarOpen ? 90 : 0 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="relative p-2 rounded-xl bg-gray-800/70 hover:bg-gray-700/70 transition-colors shadow-md"
          aria-label="Toggle menu"
        >
          <div className="w-7 h-7 flex flex-col justify-center items-center">
            <motion.span
              initial={false}
              animate={isSidebarOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white mb-1 rounded"
            />
            <motion.span
              initial={false}
              animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }}
              className="w-6 h-0.5 bg-white mb-1 rounded"
            />
            <motion.span
              initial={false}
              animate={isSidebarOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
              className="w-6 h-0.5 bg-white rounded"
            />
          </div>
          {/* Glow ring */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            animate={{ boxShadow: isSidebarOpen ? '0 0 20px rgba(0, 140, 255, .5)' : '0 0 10px rgba(255, 184, 0, .25)' }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
      </div>
      
      <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
        <WalletConnect />
        <NotificationBell />
      </div>

      {/* Enhanced Sidebar Component */}
      <EnhancedSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userProfile={userProfile}
        address={address}
        pathname={pathname}
        onMenuClick={handleMenuClick}
      />

      {/* Main Content */}
      <main className="pt-10 pb-8">
        {children}
      </main>
    </div>
  )
} 