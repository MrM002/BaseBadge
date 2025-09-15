// frontend/app/dashboard/score-card/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrustScoreCard } from '../../../components/TrustScoreCard'
import { BackendStatus } from '../../../components/BackendStatus'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, usePublicClient } from 'wagmi'
import { base } from 'viem/chains'
import { formatEther } from 'viem'
import { SCORE_CHECKER_V2_MAINNET_ABI } from '../../../components/abi/ScoreCheckerV2_MAINNET'
import { useScore } from '../../../contexts/ScoreContext'
import ProfileManager, { UserProfile } from '../../../utils/profileManager'
import { useAuth } from '../../../contexts/AuthContext'

interface TrustScoreData {
  address: string
  total_score: number
  base_score: number
  security_score: number
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
}

export default function ScoreCardPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [trustScoreData, setTrustScoreData] = useState<TrustScoreData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [canSubmit, setCanSubmit] = useState<boolean>(true)
  const [cooldownSec, setCooldownSec] = useState<number>(0)
  const [pendingScoreData, setPendingScoreData] = useState<TrustScoreData | null>(null)
  const [lastSubmittedHash, setLastSubmittedHash] = useState<`0x${string}` | undefined>(undefined)
  const [canShowCard, setCanShowCard] = useState<boolean>(false)
  const [transactionFailed, setTransactionFailed] = useState(false)

  const { address, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const publicClient = usePublicClient({ chainId: base.id })
  const submittingRef = useRef(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Dashboard context
  const { updateScores } = useScore()

  // Auth (JWT)
  const { token, isAuthenticated, login } = useAuth()
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const authHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

  // Clear when wallet changes
  useEffect(() => {
    if (address) {
      setTrustScoreData(null)
      setError(null)
    }
  }, [address])

  // Ensure JWT ready
  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      login().catch(() => {})
    }
  }, [isConnected, address, isAuthenticated, login])

  // Sidebar visual sync
  useEffect(() => {
    const handler = (e: any) => setIsSidebarOpen(Boolean(e?.detail?.open))
    window.addEventListener('bb-sidebar-toggle', handler)
    return () => window.removeEventListener('bb-sidebar-toggle', handler)
  }, [])

  // Load profile only after on-chain card exists
  useEffect(() => {
    const loadProfile = async () => {
      if (!isConnected || !address || !token) return
      if (!trustScoreData) {
        setProfile(null)
        return
      }
      try {
        const loaded = await ProfileManager.loadProfile(address, token || undefined)
        setProfile(loaded)
      } catch (e) {
        console.error('Error loading profile:', e)
      }
    }
    loadProfile()
  }, [isConnected, address, trustScoreData, token])

  // React to profile updates
  useEffect(() => {
    const onProfileUpdated = () => {
      if (isConnected && address && token && trustScoreData) {
        ProfileManager.loadProfile(address, token).then(setProfile).catch(e => console.error('Error reloading profile:', e))
      }
    }
    const onProfileDataUpdated = (event: CustomEvent) => {
      if ((event as any).detail?.address === address) {
        setProfile((event as any).detail.profile)
      }
    }
    window.addEventListener('profile-updated', onProfileUpdated as EventListener)
    window.addEventListener('profile-data-updated', onProfileDataUpdated as EventListener)
    return () => {
      window.removeEventListener('profile-updated', onProfileUpdated as EventListener)
      window.removeEventListener('profile-data-updated', onProfileDataUpdated as EventListener)
    }
  }, [isConnected, address, trustScoreData, token])

  // On-chain fee
  const scoreCheckerAddress = (process.env.NEXT_PUBLIC_SCORE_CHECKER_ADDRESS_V2_MAINNET || '0x461203d7137FdFA30907288656dBEB0f64408Fb9') as `0x${string}`
  const { data: onchainFee } = useReadContract({
    address: scoreCheckerAddress && scoreCheckerAddress !== '0x' ? scoreCheckerAddress : undefined,
    abi: SCORE_CHECKER_V2_MAINNET_ABI as any,
    functionName: 'checkFee',
    chainId: base.id,
  })

  // Cooldown (canSubmitScore)
  const { data: canSubmitData, refetch: refetchCanSubmit } = useReadContract({
    address: scoreCheckerAddress && scoreCheckerAddress !== '0x' && address ? scoreCheckerAddress : undefined,
    abi: SCORE_CHECKER_V2_MAINNET_ABI as any,
    functionName: 'canSubmitScore',
    args: address ? [address] : undefined,
    chainId: base.id,
  })

  useEffect(() => {
    let timer: any
    if (canSubmitData) {
      try {
        const arr = canSubmitData as unknown as [boolean, any]
        const flag = Boolean(arr[0])
        const seconds = Number(arr[1] ?? 0)
        setCanSubmit(flag)
        setCooldownSec(seconds)
        if (!flag && seconds > 0) {
          timer = setInterval(() => {
            setCooldownSec((s) => {
              const next = s > 0 ? s - 1 : 0
              if (next === 0) {
                setCanSubmit(true)
                try { refetchCanSubmit() } catch {}
              }
              return next
            })
          }, 1000)
        }
      } catch {}
    }
    return () => { if (timer) clearInterval(timer) }
  }, [canSubmitData, refetchCanSubmit])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, '0')}`
  }

  const { writeContract, data: txHash, isPending, error: writeError, reset: resetWrite } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({ hash: txHash })

  useEffect(() => {
    if (txHash && lastSubmittedHash && txHash === lastSubmittedHash) {
      refetchCanSubmit()
      setCanShowCard(true)
      submittingRef.current = false
    }
  }, [txHash, lastSubmittedHash, refetchCanSubmit])

  useEffect(() => {
    if (txHash) {
      setLastSubmittedHash(txHash)
      setCanShowCard(false)
    }
  }, [txHash])

  useEffect(() => {
    if (writeError) {
      submittingRef.current = false
      setIsLoading(false)
      setPendingScoreData(null)
      setTrustScoreData(null)
      setCanShowCard(false)
      try { resetWrite() } catch {}
    }
  }, [writeError, resetWrite])

  // After success -> read on-chain, update dashboard, refresh summary (JWT)
  useEffect(() => {
    if (lastSubmittedHash && isSuccess) {
      (async () => {
        try {
          // Public read (on-chain projection) - with auth headers
          const onchainResponse = await fetch(`${api}/onchain/score?address=${encodeURIComponent(address!)}`, {
            headers: authHeaders
          })
          if (!onchainResponse.ok) throw new Error('Failed to read on-chain score')
          const onchainData: TrustScoreData = await onchainResponse.json()

          setTrustScoreData(onchainData)
          setCanShowCard(true)
          setPendingScoreData(null)
          setLastSubmittedHash(undefined)
          setTransactionFailed(false)
          refetchCanSubmit()
          submittingRef.current = false

          // Update dashboard context
          await updateScores({
            total_score: onchainData.total_score,
            base_score: onchainData.base_score,
            security_score: onchainData.security_score,
            date: new Date().toISOString()
          })

          // Force secured summary refresh (JWT)
          try {
            await fetch(`${api}/dashboard/summary`, { headers: authHeaders })
          } catch {}
        } catch (err) {
          console.error('Failed to read on-chain data:', err)
          setError('Transaction succeeded but failed to read on-chain data. Please refresh.')
          setCanShowCard(false)
          submittingRef.current = false
        }
      })()
    }
  }, [lastSubmittedHash, isSuccess, refetchCanSubmit, updateScores, address, api, token])

  useEffect(() => {
    if (lastSubmittedHash && isError) {
      setTransactionFailed(true)
      setLastSubmittedHash(undefined)
      submittingRef.current = false
    }
  }, [lastSubmittedHash, isError])

  const handleCheckScore = async () => {
    if (!isConnected || !address) return
    if (isPending || isConfirming || submittingRef.current) return

    // Ensure JWT
    if (!isAuthenticated) {
      try { await login() } catch { setError('Login failed'); return }
    }
    if (!token) { setError('Missing auth token'); return }

    setIsLoading(true)
    setError(null)
    setTrustScoreData(null)
    setPendingScoreData(null)
    setCanShowCard(false)
    submittingRef.current = true

    try {
      // Switch to Base Mainnet
      try {
        await switchChainAsync({ chainId: base.id })
      } catch {
        const eth = typeof window !== 'undefined' ? (window as any).ethereum : undefined
        if (eth?.request) {
          try {
            await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x2105' }] })
          } catch (e: any) {
            if (e && (e.code === 4902 || e.message?.includes('Unrecognized chain ID'))) {
              try {
                await eth.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0x2105',
                    chainName: 'Base',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://mainnet.base.org'],
                    blockExplorerUrls: ['https://basescan.org']
                  }]
                })
              } catch {}
            }
          }
        }
      }

      // On-chain cooldown gate (fresh)
      if (publicClient) {
        try {
          const res = await publicClient.readContract({
            address: scoreCheckerAddress,
            abi: SCORE_CHECKER_V2_MAINNET_ABI as any,
            functionName: 'canSubmitScore',
            args: [address],
          }) as unknown as [boolean, bigint]
          const flag = Boolean(res[0])
          const seconds = Number(res[1] ?? 0)
          setCanSubmit(flag)
          setCooldownSec(seconds)
          if (!flag || seconds > 0) {
            throw new Error(`Please wait ${formatTime(seconds)} before checking again.`)
          }
        } catch (e: any) {
          setError(e instanceof Error ? e.message : 'Please wait before checking again.')
          submittingRef.current = false
          setIsLoading(false)
          return
        }
      }

      // Fee required
      if (!onchainFee) throw new Error('Fetching fee...')

      // 1) Compute score (secured via rewrite + JWT)
      //    Use site-relative BFF path to avoid direct api.<domain> and CORS/WAF issues.
      const freshToken = token || (typeof window !== 'undefined' ? localStorage.getItem('bb_token') : null)
      const authz: HeadersInit = freshToken ? { Authorization: `Bearer ${freshToken}` } : {}
      const scoreRes = await fetch(`/api/bff/score?details=true`, { headers: authz, cache: 'no-store' })
      if (!scoreRes.ok) throw new Error('Failed to fetch trust score')
      const data = await scoreRes.json()

      setPendingScoreData(data)
      const total = Math.round(Number(data?.total_score ?? 0))
      if (!Number.isFinite(total)) throw new Error('Invalid score')

      // 2) Get EIP-712 signature (secured via rewrite + JWT)
      const query = new URLSearchParams({
        // address is optional if backend binds JWT->address, but harmless to include:
        address: address,
        total_score: data.total_score.toString(),
        base_score: (data.base_score || data.base?.base_score || 0).toString(),
        security_score: (data.security_score || data.security?.security_score || 0).toString(),
        tx_count: (data.base?.tx_count || 0).toString(),
        current_streak: (data.base?.current_streak || 0).toString(),
        max_streak: (data.base?.max_streak || 0).toString(),
        current_balance: (data.base?.current_balance || 0).toString(),
        avg_balance_last_month: (data.base?.past_balance || 0).toString(),
        gas_paid: (data.base?.gas_used || 0).toString(),
        suspicious_tokens: (data.security?.risky_tokens || 0).toString(),
        suspicious_contracts: (data.security?.risky_contracts || 0).toString(),
        dangerous_interactions: (data.security?.risky_signs || 0).toString(),
        suspicious_nfts: (data.security?.suspicious_nfts || 0).toString(),
      })
      
      const sigRes = await fetch(`/api/bff/score/sign_card?` + query.toString(), { headers: authz, cache: 'no-store' })
      if (!sigRes.ok) throw new Error('Failed to sign score card')
      const sig = await sigRes.json()
      const sigHex = (typeof sig.signature === 'string' && sig.signature.startsWith('0x'))
        ? sig.signature as `0x${string}`
        : (`0x${sig.signature}` as `0x${string}`)

      // 3) Submit on-chain
      try { await switchChainAsync({ chainId: base.id }) } catch {}
      writeContract({
        address: scoreCheckerAddress,
        abi: SCORE_CHECKER_V2_MAINNET_ABI as any,
        functionName: 'submitScoreCard',
        args: [
          BigInt(sig.totalScore),
          BigInt(sig.baseScore),
          BigInt(sig.securityScore),
          BigInt(sig.numberOfTransactions),
          BigInt(sig.currentStreak),
          BigInt(sig.maxStreak),
          BigInt(sig.currentBalance),
          BigInt(sig.avgBalanceLastMonth),
          BigInt(sig.gasPaid),
          BigInt(sig.suspiciousTokens),
          BigInt(sig.suspiciousContracts),
          BigInt(sig.dangerousInteractions),
          BigInt(sig.suspiciousOilCompanies),
          BigInt(sig.issuedAt),
          BigInt(sig.nonce),
          sigHex
        ],
        chainId: base.id,
        value: onchainFee as bigint,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      submittingRef.current = false
    } finally {
      setIsLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gamefi-black via-gray-900 to-gamefi-dark-blue">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Wallet Connection Required</h1>
            <p className="text-gray-300">Please connect your wallet to view your score card</p>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative min-h-screen ${isSidebarOpen ? 'pointer-events-none select-none' : ''}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.2 }} className="mb-12">
            <h1 className="text-6xl md:text-7xl font-bold mb-8">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">Check Your</span>
              <span className="block text-white mt-2">Wallet Score</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Analyze your wallet's reputation and security score on <span className="text-cyan-400 font-semibold">Base</span> Network
            </p>
          </motion.div>

          {/* Button */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mb-16">
            <motion.button
              ref={buttonRef}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckScore}
              disabled={isLoading || (!canSubmit && !transactionFailed) || isPending || isConfirming}
              className="group relative text-white font-bold py-8 px-16 rounded-3xl text-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
            >
              <motion.div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
              <motion.div
                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }}
                animate={{ backgroundPositionX: ['0%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (<><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-white"></div>Analyzing Wallet...</>) : (<><span className="text-3xl">⚡</span>Check My Score</>)}
              </span>
            </motion.button>
          </motion.div>

          {/* Fee & Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <span className="text-cyan-400 font-medium">Transaction Fee</span>
              </div>
              {onchainFee ? (
                <p className="text-gray-300 text-center">
                  <span className="text-white font-semibold">{formatEther(onchainFee as bigint)} ETH</span> on <span className="text-cyan-400">Base Mainnet</span>
                </p>
              ) : (
                <p className="text-gray-300 text-center">Loading fee information...</p>
              )}
              <p className="text-gray-300 text-sm text-center mt-2">Small fee to deter spam and cover infrastructure costs</p>
            </div>

            {!canSubmit && cooldownSec > 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-red-400">
                  <span className="text-xl">⏰</span>
                  <span className="font-medium">Cooldown Active</span>
                </div>
                <p className="text-red-300 mt-1">Please wait <span className="font-bold">{formatTime(cooldownSec)}</span> before the next check</p>
              </motion.div>
            )}

            {(txHash || isPending || isConfirming || isSuccess) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-4 text-center mt-4">
                <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                  <span className="text-xl">🔄</span>
                  <span className="font-medium">
                    {isPending && 'Submitting Transaction...'}
                    {isConfirming && 'Waiting for Confirmations...'}
                    {isSuccess && 'Transaction Confirmed!'}
                  </span>
                </div>
                {txHash && (
                  <a className="text-blue-300 hover:text-blue-200 underline text-sm" href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer">
                    View on Explorer
                  </a>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        {/* Backend Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }} className="mb-12 flex justify-center">
          <BackendStatus />
        </motion.div>

        {/* Trust Score Card */}
        {canShowCard && trustScoreData && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="mb-12">
            <TrustScoreCard
              address={address!}
              totalScore={trustScoreData.total_score}
              baseScore={trustScoreData.base_score}
              securityScore={trustScoreData.security_score}
              base={trustScoreData.base}
              security={trustScoreData.security}
              profile={profile || undefined}
              startCollapsed
            />
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mb-12 max-w-2xl mx-auto">
            <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-3 text-red-400 mb-3">
                <span className="text-2xl">⚠️</span>
                <span className="text-lg font-medium">Error Occurred</span>
              </div>
              <p className="text-red-300 text-center">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Tx Failed */}
        {transactionFailed && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mb-12 max-w-2xl mx-auto">
            <div className="bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-3 text-orange-400 mb-3">
                <span className="text-2xl">⚠️</span>
                <span className="text-lg font-medium">Transaction Failed</span>
              </div>
              <p className="text-orange-300 text-center">Your transaction failed. You can try again.</p>
            </div>
          </motion.div>
        )}

        {/* Help */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1.0 }} className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-3">
                <span className="text-3xl">💡</span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">How It Works</span>
              </h3>
              <p className="text-gray-300 text-lg">Blockchain-based wallet reputation scoring system</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="text-4xl mb-3">🔍</div>
                <h4 className="text-white font-semibold mb-2">Analysis</h4>
                <p className="text-gray-400 text-sm">Comprehensive analysis of your wallet's transaction history and activity patterns on Base Network</p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl mb-3">📊</div>
                <h4 className="text-white font-semibold mb-2">Scoring</h4>
                <p className="text-gray-400 text-sm">Multi-factor reputation scoring based on transaction behavior, security patterns, and network activity</p>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl mb-3">🔗</div>
                <h4 className="text-white font-semibold mb-2">On-Chain</h4>
                <p className="text-gray-400 text-sm">Permanent on-chain recording of your reputation score for transparency and verification</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
