'use client'

import { ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { coinbaseWallet, metaMask } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { ScoreProvider } from '../contexts/ScoreContext'
import { AuthProvider } from '../contexts/AuthContext'

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'BaseBadge',
      preference: 'all',
      jsonRpcUrl: 'https://mainnet.base.org',
      appLogoUrl: 'https://basebadge.com/logo.png',
    }),
    metaMask(),
  ],
  ssr: true,
  transports: {
    [base.id]: http(), // uses public Base RPC unless you set NEXT_PUBLIC_BASE_RPC_URL elsewhere
  },
})

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider chain={base}>
          {/* AuthProvider MUST wrap ScoreProvider so ScoreContext can read JWT */}
          <AuthProvider>
            <ScoreProvider>
              {children}
            </ScoreProvider>
          </AuthProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
