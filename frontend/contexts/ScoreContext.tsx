// frontend/contexts/ScoreContext.tsx
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useAuth } from './AuthContext'

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
  const { token, isAuthenticated } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)

  // In-memory only
  const [lastScores, setLastScores] = useState<ScoreData | null>(null)
  const [scoreHistory, setScoreHistory] = useState<ScoreData[]>([])
  const [badges, setBadges] = useState<BadgeData[]>([])

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`
    return headers
  }, [token])

  const resetState = useCallback(() => {
    setLastScores(null)
    setScoreHistory([])
    setBadges([])
    setLastUpdateTime(0)
    setError(null)
  }, [])

  const loadOnchainScores = useCallback(async () => {
    if (!isConnected || !address) return
    setIsLoading(true)
    setError(null)
    try {
      const url = `${API_BASE}/dashboard/summary?address=${encodeURIComponent(address as unknown as string)}`
      const res = await fetch(url, { headers: buildHeaders() })
      if (!res.ok) {
        resetState()
        return
      }
      const data = await res.json()
      if (data.lastScores && data.lastScores.total_score > 0) {
        setLastScores(data.lastScores)
        setScoreHistory(data.scoreHistory || [])
        setBadges(data.badges || [])
        setLastUpdateTime(Date.now())
      } else {
        resetState()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load on-chain data')
      resetState()
    } finally {
      setIsLoading(false)
    }
  }, [API_BASE, address, isConnected, buildHeaders, resetState])

  // Load when wallet/auth becomes available; clear on disconnect
  useEffect(() => {
    if (isConnected && address) {
      loadOnchainScores()
    } else {
      resetState()
    }
  }, [isConnected, address, isAuthenticated, token, loadOnchainScores, resetState])

  const refreshScores = useCallback(async () => {
    await loadOnchainScores()
  }, [loadOnchainScores])

  const updateScores = useCallback(async (newScores: ScoreData) => {
    setLastScores(newScores)
    setScoreHistory(prev => [...prev, newScores].slice(-30))
    setLastUpdateTime(Date.now())
    try {
      if (!address) return
      const url = `${API_BASE}/badges?address=${encodeURIComponent(address as unknown as string)}`
      const res = await fetch(url, { headers: buildHeaders() })
      if (res.ok) {
        const badgeData = await res.json()
        if (badgeData.badges) setBadges(badgeData.badges)
      }
    } catch {
      // Silent failure: UI already updated locally
    }
  }, [API_BASE, address, buildHeaders])

  const clearScores = useCallback(() => {
    resetState()
  }, [resetState])

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

  return <ScoreContext.Provider value={value}>{children}</ScoreContext.Provider>
}

export function useScore() {
  const context = useContext(ScoreContext)
  if (context === undefined) {
    throw new Error('useScore must be used within a ScoreProvider')
  }
  return context
}
