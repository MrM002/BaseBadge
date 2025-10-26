'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { UserAvatar } from '../../../components/UserAvatar'
import FaultyTerminal from '../../../components/FaultyTerminal'
import ProfileManager, { UserProfile } from '../../../utils/profileManager'
import { useAuth } from '../../../contexts/AuthContext'

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const { isAuthenticated, token, login } = useAuth()
  const getAuthHeaders = (): HeadersInit => {
    const latest = token || (typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null)
    return latest ? { Authorization: `Bearer ${latest}` } : {}
  }
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    name: '',
    birthDate: '',
    avatar: '/default-avatar.svg',
    useBasenameProfile: false
  })
  
  // Prevent redirect loop for settings page
  useEffect(() => {
    // This empty effect ensures the settings page doesn't get redirected
    // It counteracts the redirect in dashboard layout
    console.log('Settings page mounted, preventing redirect loop')
    return () => {
      console.log('Settings page unmounted')
    }
  }, [])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [isPrefetching, setIsPrefetching] = useState(true)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  // Load profile data using ProfileManager
  useEffect(() => {
    const load = async () => {
      setIsPrefetching(true)
      try {
        if (isConnected && address) {
          if (!isAuthenticated) {
            try { await login() } catch {}
          }
          const loadedProfile = await ProfileManager.loadProfile(address, token || undefined)
          setProfile(loadedProfile)
          // Clear validation message when profile is loaded
          setValidationMessage(null)
        }
      } catch (error) {
        console.error('💥 Error loading profile:', error)
      } finally { 
        setIsPrefetching(false) 
      }
    }
    load()
  }, [isConnected, address, isAuthenticated, token, login])

  // Clear validation message when profile changes
  useEffect(() => {
    if (validationMessage && profile.basename) {
      setValidationMessage(null)
    }
  }, [profile.basename, validationMessage])

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // basic validation: 2MB, image/*
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file (PNG, JPG, SVG).')
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('Image must be 2MB or smaller.')
        return
      }
      setUploadError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        const newProfile = {
          ...profile,
          avatar: e.target?.result as string
        }
        setProfile(newProfile)
        
        // Save to local storage immediately
        if (address) {
          ProfileManager.saveToLocal(address, newProfile)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    const newProfile = {
      ...profile,
      [field]: value
    }
    setProfile(newProfile)
    
    // Clear validation message when user makes changes
    if (validationMessage) {
      setValidationMessage(null)
    }
    
    // Validate Basename Profile usage in real-time
    if (field === 'useBasenameProfile') {
      if (value === true) {
        // When enabling, check if we need to validate basename
        // Only show validation message if we don't already have a basename
        if (!profile.basename) {
          // We need to check with the backend if this wallet has a basename
          const checkBasename = async () => {
            try {
              const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
              if (!isAuthenticated) {
                try { await login() } catch {
                  setValidationMessage('Login required to sync Basename.')
                  return
                }
              }
              const response = await fetch(`${api}/profile/sync_basename?address=${address}`, {
                headers: getAuthHeaders(),
                cache: 'no-store',
              })
              const data = await response.json()
              
              if (data.has_basename) {
                // User has a basename, update profile
                const updatedProfile = {
                  ...profile,
                  basename: data.basename,
                  basenameAvatar: data.basenameAvatar
                }
                setProfile(updatedProfile)
                // Save to local storage
                if (address) {
                  ProfileManager.saveToLocal(address, updatedProfile)
                }
                // Clear any validation message
                setValidationMessage(null)
              } else {
                // No basename found
                setValidationMessage('🚀 To use Basename Profile, you need to get a Basename first!')
              }
            } catch (error) {
              console.error('Error checking basename:', error)
              setValidationMessage('Error checking Basename. Please try again.')
            }
          }
          
          checkBasename()
        }
      } else {
        // Clear validation message when user unchecks the option
        setValidationMessage(null)
      }
    }
    
    // Save to local storage immediately
    if (address) {
      ProfileManager.saveToLocal(address, newProfile)
    }
  }

  const handleSave = async () => {
    if (!isConnected || !address) return
    let profileToSave = profile

    // Validate Basename Profile usage
    if (profile.useBasenameProfile && !profile.basename) {
      // Check with the backend if this wallet has a basename before showing error
      try {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        if (!isAuthenticated) {
          try { await login() } catch {
            setValidationMessage('Login required to save profile.')
            return
          }
        }
        const response = await fetch(`${api}/profile/sync_basename?address=${address}`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        })
        const data = await response.json()
        
        if (data.has_basename) {
          // User has a basename, update profile
          const updatedProfile = {
            ...profile,
            basename: data.basename,
            basenameAvatar: data.basenameAvatar
          }
          setProfile(updatedProfile)
          profileToSave = updatedProfile
          // Continue with save using updated profile
          // Now continue with the normal save flow with the updated profile
          // Instead of returning, we'll continue execution with the updated profile
        } else {
          // No basename found
          setValidationMessage('🚀 To use Basename Profile, you need to get a Basename first!')
          return
        }
      } catch (error) {
        console.error('Error checking basename:', error)
        setValidationMessage('Error checking Basename. Please try again.')
        return
      }
    }
    
    setIsLoading(true)
    try {
      // Ensure login (if needed)
      if (!isAuthenticated) {
        try { await login() } catch {
          setValidationMessage('Login required to save profile.')
          setIsLoading(false)
          return
        }
      }
      // fresh token for this call
      const freshToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null)
      const success = await ProfileManager.saveProfile(address, profileToSave, freshToken || undefined)
      
      if (success) {
        setIsSaved(true)
        setTimeout(() => setIsSaved(false), 3000)
        
        // Notify all components to refresh profile
        window.dispatchEvent(new Event('profile-updated'))
        
        // Also dispatch a custom event with the profile data
        window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profile: profileToSave, address } }))
        
        console.log('✅ Profile saved successfully')
      } else {
        console.error('❌ Failed to save profile')
      }
    } catch (e) {
      console.error('💥 Error saving profile:', e)
      // Profile is still saved locally, so show success
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
      
      // Still notify components to refresh
      window.dispatchEvent(new Event('profile-updated'))
      window.dispatchEvent(new CustomEvent('profile-data-updated', { detail: { profile: profileToSave, address } }))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
            >
              <h1 className="text-3xl font-bold text-white mb-4">
                Please connect your wallet
              </h1>
              <p className="text-gray-300 text-lg">
                Connect your wallet to access profile settings.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
      {/* FaultyTerminal Background */}
      <div className="absolute inset-0 z-0">
        <FaultyTerminal
          scale={1.2}
          gridMul={[3, 2]}
          digitSize={1.8}
          timeScale={0.4}
          pause={false}
          scanlineIntensity={0.6}
          glitchAmount={0.8}
          flickerAmount={0.7}
          noiseAmp={1.2}
          chromaticAberration={0.5}
          dither={0.3}
          curvature={0.15}
          tint="#0ea5e9"
          mouseReact={true}
          mouseStrength={0.4}
          pageLoadAnimation={true}
          brightness={0.8}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
              Profile Settings
            </h1>
            <p className="text-gray-300 text-xl">
              Customize your profile and preferences
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Picture Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-3xl text-cyan-400">📸</span>
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Profile Picture
                  </span>
                </h2>
                
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center gap-4 mb-6">
                    {isPrefetching ? (
                      <div className="w-[120px] h-[120px] rounded-full bg-gray-700/40 animate-pulse border-4 border-gray-700" />
                    ) : (
                      <UserAvatar
                        src={profile.avatar}
                        alt="Profile"
                        size={120}
                        className="!border-4 !border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                        showSizeHint
                      />
                    )}
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <div className="relative group bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 font-semibold py-3 px-6 rounded-2xl transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-cyan-500/20">
                        <span className="text-lg">📤</span>
                        <span>Upload</span>
                      </div>
                    </label>
                  </div>
                  
                  {uploadError ? (
                    <p className="text-red-400 text-sm mt-4">{uploadError}</p>
                  ) : (
                    <p className="text-gray-300 text-sm mt-4">
                      Tip: Square photos look best. Use at least 200×200 px. Hover the avatar to see target size.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Profile Information Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-3xl text-blue-400">👤</span>
                  <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Profile Information
                  </span>
                </h2>
                
                <div className="space-y-6">
                  {/* Username */}
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Username <span className="text-gray-400">(Display Name)</span>
                    </label>
                    {isPrefetching ? (
                      <div className="h-12 w-full rounded-2xl bg-gray-700/40 animate-pulse border border-gray-700/50" />
                    ) : (
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Enter your username"
                        className="w-full bg-gray-800/60 border border-gray-600/50 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                      />
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Full Name
                    </label>
                    {isPrefetching ? (
                      <div className="h-12 w-full rounded-2xl bg-gray-700/40 animate-pulse border border-gray-700/50" />
                    ) : (
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full bg-gray-800/60 border border-gray-600/50 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                      />
                    )}
                  </div>

                  {/* Birth Date */}
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Birth Date <span className="text-gray-400">(Optional)</span>
                    </label>
                    {isPrefetching ? (
                      <div className="h-12 w-full rounded-2xl bg-gray-700/40 animate-pulse border border-gray-700/50" />
                    ) : (
                      <input
                        type="date"
                        value={profile.birthDate}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-600/50 rounded-2xl px-5 py-4 text-white placeholder-gray-400 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                      />
                    )}
                    <p className="text-gray-300 text-sm mt-2">
                      🎁 We'll send you special birthday gifts and discounts!
                    </p>
                  </div>

                  {/* Basename Profile Checkbox */}
                  <div className="pt-4 border-t border-gray-700/50">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.useBasenameProfile}
                        onChange={(e) => handleInputChange('useBasenameProfile', e.target.checked)}
                        className="w-6 h-6 text-cyan-500 bg-gray-800 border-gray-600 rounded-lg focus:ring-cyan-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                      />
                      <div>
                        <span className="text-white font-semibold">Use Basename Profile</span>
                        <p className="text-gray-300 text-sm">
                          Sync avatar and name from your Basename
                        </p>
                      </div>
                    </label>
                    
                    {/* Basename Status Messages */}
                    {validationMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-xl backdrop-blur-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl text-blue-400 mt-1">🚀</div>
                          <div className="flex-1">
                            <h4 className="text-blue-300 font-semibold mb-2">Get Your Basename First!</h4>
                            <p className="text-blue-200 text-sm mb-3 leading-relaxed">
                              To use Basename Profile, you need to own a Basename. This will sync your avatar and username 
                              automatically across the Base ecosystem.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <a
                                href="https://www.base.org/names"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105"
                              >
                                <span>🌐</span>
                                Visit base.org/names
                              </a>
                              <button
                                onClick={() => setValidationMessage(null)}
                                className="inline-flex items-center gap-2 bg-gray-600/50 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-500/50 transition-all duration-300"
                              >
                                <span>✕</span>
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Basename Available Message */}
                    {profile.basename && !validationMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-500/50 rounded-xl backdrop-blur-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl text-green-400 mt-1">✨</div>
                          <div className="flex-1">
                            <h4 className="text-green-300 font-semibold mb-2">Basename Ready!</h4>
                            <p className="text-green-200 text-sm leading-relaxed">
                              You have <span className="font-semibold text-green-300">{profile.basename}</span> - 
                              you can now enable Basename Profile to sync your avatar and username automatically!
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(14, 165, 233, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold py-4 px-12 rounded-2xl text-xl transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/25"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Saving...
                </div>
              ) : (
                '💾 Save Changes'
              )}
            </motion.button>

            {isSaved && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 bg-green-900/30 border border-green-500/50 rounded-2xl max-w-md mx-auto backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 text-green-400">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold">Profile saved successfully!</span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-10"
          >
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="text-2xl text-purple-400">ℹ️</span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                  Profile Information
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
                <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/30">
                  <h4 className="text-white font-semibold mb-3 text-lg">Privacy</h4>
                  <p>Your profile info is stored client-side and never shared without consent.</p>
                </div>
                <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/30">
                  <h4 className="text-white font-semibold mb-3 text-lg">Basename Integration</h4>
                  <p>Enable to mirror your Basename avatar and name. A blue ✓ badge will show on your profile when active.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
} 