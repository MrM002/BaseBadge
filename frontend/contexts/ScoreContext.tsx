'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'

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

interface ScoreContextType {
  lastScores: ScoreData | null
  scoreHistory: ScoreData[]
  badges: BadgeData[]
  isLoading: boolean
  error: string | null
  score: ScoreData | null
  setScore: (newScore: ScoreData) => Promise<void>
  refreshScores: () => Promise<void>
  updateScores: (newScores: ScoreData) => Promise<void>
  clearScores: () => void
  lastUpdateTime: number
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined)

export function ScoreProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)
  
  // CRITICAL: Store data in memory only - no localStorage persistence
  const [lastScores, setLastScores] = useState<ScoreData | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScoreData[]>([])
  const [badges, setBadges] = useState<BadgeData[]>([])

  // CRITICAL: Load scores from on-chain data when wallet connects
  const loadOnchainScores = useCallback(async () => {
    if (!isConnected || !address) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Loading on-chain scores for address:', address)
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${api}/dashboard/summary?address=${encodeURIComponent(address)}`)
      
      if (!res.ok) {
        console.log('❌ No on-chain data found - user must complete Score Card transaction first')
        setLastScores(null)
        setScoreHistory([])
        setBadges([])
        setLastUpdateTime(0)
        return
      }
      
      const data = await res.json()
      console.log('✅ On-chain data loaded:', data)
      
      if (data.lastScores && data.lastScores.total_score > 0) {
        setLastScores(data.lastScores)
        setScoreHistory(data.scoreHistory || [])
        setBadges(data.badges || [])
        setLastUpdateTime(Date.now())
        console.log('✅ Dashboard updated with on-chain data')
      } else {
        console.log('🚫 No valid on-chain score data found')
        setLastScores(null)
        setScoreHistory([])
        setBadges([])
        setLastUpdateTime(0)
      }
      
    } catch (e) {
      console.error('💥 Failed to load on-chain scores:', e)
      setError(e instanceof Error ? e.message : 'Failed to load on-chain data')
      setLastScores(null)
      setScoreHistory([])
      setBadges([])
      setLastUpdateTime(0)
    } finally {
      setIsLoading(false)
    }
  }, [isConnected, address])

  // CRITICAL: Auto-load on-chain data when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      console.log('🔄 Wallet connected - loading on-chain data')
      loadOnchainScores()
    } else {
      // Clear data when wallet disconnects
      setLastScores(null)
      setScoreHistory([])
      setBadges([])
      setLastUpdateTime(0)
      setError(null)
    }
  }, [isConnected, address, loadOnchainScores])

  // Refresh scores from on-chain data
  const refreshScores = useCallback(async () => {
    await loadOnchainScores()
  }, [loadOnchainScores])

  // Update scores manually (e.g., after new Score Card transaction)
  const updateScores = useCallback(async (newScores: ScoreData) => {
    console.log('✅ Updating scores after Score Card transaction:', newScores)
    
    // Update local state immediately
    setLastScores(newScores)
    setScoreHistory(prev => [...prev, newScores].slice(-30)) // Keep last 30
    setLastUpdateTime(Date.now())
    
    // CRITICAL: Also refresh badges from on-chain
    try {
      if (address) {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const res = await fetch(`${api}/badges?address=${encodeURIComponent(address)}`)
        if (res.ok) {
          const badgeData = await res.json()
          if (badgeData.badges) {
            setBadges(badgeData.badges)
            console.log('✅ Badges refreshed from on-chain after score update')
          }
        }
    }
    } catch (error) {
      console.error('Failed to refresh badges from on-chain:', error)
    }
  }, [address])

  // Clear all data
  const clearScores = useCallback(() => {
    setLastScores(null)
    setScoreHistory([])
    setBadges([])
    setError(null)
    setLastUpdateTime(0)
    console.log('🧹 All score data cleared')
  }, [])

  const value: ScoreContextType = {
    lastScores,
    scoreHistory,
    badges,
    isLoading,
    error,
    score: lastScores,
    setScore: updateScores,
    refreshScores,
    updateScores,
    clearScores,
    lastUpdateTime,
  }

  return (
    <ScoreContext.Provider value={value}>
      {children}
    </ScoreContext.Provider>
  )
}

export function useScore() {
  const context = useContext(ScoreContext)
  if (context === undefined) {
    throw new Error('useScore must be used within a ScoreProvider')
  }
  return context
}
