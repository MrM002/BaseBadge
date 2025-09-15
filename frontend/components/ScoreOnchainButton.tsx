'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract, useSwitchChain } from 'wagmi'
import { formatEther } from 'viem'
import { base } from 'viem/chains'
import { SCORE_CHECKER_V2_MAINNET_ABI } from './abi/ScoreCheckerV2_MAINNET'

interface Props {
  contractAddress: `0x${string}`
  onSuccess?: (txHash: `0x${string}`) => void
  className?: string
}

export function ScoreOnchainButton({ contractAddress, onSuccess, className = '' }: Props) {
  const { address, chainId, isConnected } = useAccount()
  const { switchChainAsync } = useSwitchChain()
  const [uiError, setUiError] = useState<string | null>(null)

  const { data: fee } = useReadContract({
    address: contractAddress,
    abi: SCORE_CHECKER_V2_MAINNET_ABI as any,
    functionName: 'checkFee',
    chainId: base.id,
  })

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (isSuccess && hash) {
      onSuccess?.(hash)
    }
  }, [isSuccess, hash, onSuccess])

  const handleClick = async () => {
    setUiError(null)

    if (!isConnected || !address) {
      setUiError('Please connect your wallet.')
      return
    }

    // Ensure Base chain
    if (chainId !== base.id) {  
      try {
        await switchChainAsync({ chainId: base.id })
      } catch {
        setUiError('Please switch to ' + 'Base'.replace('Base', '<span class="text-gamefi-blue">Base</span>') + ' network.')
        return
      }
    }
    if (!fee) {
      setUiError('Fetching fee... try again.')
      return
    }
    try {
      writeContract({
        address: contractAddress,
        abi: SCORE_CHECKER_V2_MAINNET_ABI as any,
        functionName: 'checkScore',
        args: [],
        value: fee as bigint,
        chainId: base.id,
      })
    } catch (e: any) {
      setUiError(e?.message || 'Transaction failed')
    }
  }

  const label = isPending || isConfirming ? 'Processing...' : 'Check My Score (Onchain)'

  return (
    <div className={className}>
      <button
        onClick={handleClick}
        disabled={!fee || isPending || isConfirming}
        className="bg-gradient-to-r from-gamefi-blue to-gamefi-yellow text-black font-bold py-3 px-6 rounded-xl text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {label}
      </button>
      <div className="text-xs text-gray-400 mt-1">
        {fee ? `Fee: ${formatEther(fee as bigint)} ETH` : 'Fetching fee...'}
      </div>
      {(uiError || error) && (
        <div className="text-xs text-red-400 mt-1">{uiError || (error as any)?.message}</div>
      )}
      {hash && (
        <div className="text-xs text-gray-400 mt-1">
          Tx:{' '}
          <a className="underline" href={`https://basescan.org/tx/${hash}`} target="_blank" rel="noreferrer">
            View
          </a>
        </div>
      )}
    </div>
  )
}


