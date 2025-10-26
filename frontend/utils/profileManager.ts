// Profile Manager Utility
// Handles local storage and backend synchronization for user profiles

export interface UserProfile {
  username: string
  name?: string
  birthDate?: string
  avatar: string
  useBasenameProfile: boolean
  basename?: string
  basenameAvatar?: string
}

const LOCAL_PROFILE_KEY = 'bb_user_profile'

function authHeaders(token?: string, extra?: HeadersInit): HeadersInit {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}


export class ProfileManager {
  /**
   * Load profile from local storage
   */
  static loadFromLocal(address: string): UserProfile | null {
    try {
      const localProfile = localStorage.getItem(`${LOCAL_PROFILE_KEY}_${address}`)
      if (localProfile) {
        return JSON.parse(localProfile)
      }
    } catch (error) {
      console.error('❌ Failed to load profile from local storage:', error)
    }
    return null
  }

  /**
   * Save profile to local storage
   */
  static saveToLocal(address: string, profile: UserProfile): void {
    try {
      localStorage.setItem(`${LOCAL_PROFILE_KEY}_${address}`, JSON.stringify(profile))
      console.log('✅ Profile saved to local storage:', profile)
    } catch (error) {
      console.error('❌ Failed to save profile to local storage:', error)
    }
  }

  /**
   * Load profile from backend
   */
  static async loadFromBackend(address: string, token?: string): Promise<UserProfile | null> {
    try {
      if (!token) {
        return null
      }
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(
        `${api}/profile?address=${encodeURIComponent(address)}`,
        { headers: authHeaders(token), cache: 'no-store' }
      )
      if (res.ok) {
        const data = await res.json()
        return {
          username: data.username || '',
          name: data.name || '',
          birthDate: data.birthDate || '',
          avatar: data.avatar || '/default-avatar.svg',
          useBasenameProfile: !!data.useBasenameProfile,
          basename: data.basename || '',
          basenameAvatar: data.basenameAvatar || undefined,
        }
      }
    } catch (error) {
      console.log('⚠️ Backend unavailable:', error)
    }
    return null
  }

  /**
   * Save profile to backend
   */
  static async saveToBackend(address: string, profile: UserProfile, token?: string): Promise<boolean> {
    try {
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      if (!token) throw new Error('Missing auth token')

      // if useBasenameProfile is enabled, sync_basename should be included in the headers
      let payload: any = { address, ...profile }
      if (profile.useBasenameProfile) {
        const syncRes = await fetch(
          `${api}/profile/sync_basename?address=${encodeURIComponent(address)}`,
          { headers: authHeaders(token), cache: 'no-store' }
        )
        const syncData = syncRes.ok ? await syncRes.json() : null
        if (!syncData?.has_basename) {
          throw new Error('To use Basename profile, please set a Basename for your wallet first.')
        }
        payload = {
          ...payload,
          basename: syncData.basename || profile.basename,
          basenameAvatar: syncData.basenameAvatar || profile.basenameAvatar,
        }
      }

      const res = await fetch(`${api}/profile`, {
        method: 'POST',
        headers: authHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save profile to backend')
      return true
    } catch (error) {
      console.error('❌ Failed to save profile to backend:', error)
      return false
    }
  }

  /**
   * Load profile with fallback strategy (local first, then backend)
   */
  static async loadProfile(address: string, token?: string): Promise<UserProfile> {
    // 1) local first
    const localProfile = this.loadFromLocal(address)

    // 2) backend with header(if have token)
    const backendProfile = await this.loadFromBackend(address, token)

    if (backendProfile) {
      const mergedProfile = { ...(localProfile || {}), ...backendProfile }
      this.saveToLocal(address, mergedProfile)
      return mergedProfile
    }

    // 3) fallback
    return localProfile || {
      username: '',
      avatar: '/default-avatar.svg',
      useBasenameProfile: false,
      basename: undefined,
      basenameAvatar: undefined,
    }
  }


  /**
   * Save profile with local storage and backend sync
   */
  static async saveProfile(address: string, profile: UserProfile, token?: string): Promise<boolean> {
    // first local
    this.saveToLocal(address, profile)

    // after backend
    const backendSuccess = await this.saveToBackend(address, profile, token)

    if (backendSuccess) {
      const backendProfile = await this.loadFromBackend(address, token)
      if (backendProfile) this.saveToLocal(address, backendProfile)
    }

    return true
  }


  /**
   * Get display name based on profile settings
   */
  static getDisplayName(profile: UserProfile, address: string): string {
    if (profile.useBasenameProfile && profile.basename && profile.basename.trim()) {
      return profile.basename.trim()
    }
    if (profile.username && profile.username.trim()) {
      const cleanUsername = profile.username.trim()
      return cleanUsername.length > 20 ? `${cleanUsername.substring(0, 17)}...` : cleanUsername
    }
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    return 'User'
  }

  /**
   * Get avatar URL based on profile settings
   */
  static getAvatarUrl(profile: UserProfile): string {
    if (profile.useBasenameProfile && profile.basenameAvatar && profile.basenameAvatar.trim()) {
      return profile.basenameAvatar.trim()
    }
    if (profile.avatar && profile.avatar.trim() && profile.avatar !== '/default-avatar.svg') {
      return profile.avatar.trim()
    }
    return '/default-avatar.svg'
  }

  /**
   * Check if profile has Basename integration
   */
  static hasBasenameIntegration(profile: UserProfile): boolean {
    return profile.useBasenameProfile && !!profile.basename
  }
}

// Export default instance
export default ProfileManager
