'use client'

import { ReactNode } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base } from 'wagmi/chains'
import { 
  coinbaseWallet, 
  metaMask, 
} from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { OnchainKitProvider } from '@coinbase/onchainkit'
import { ScoreProvider } from '../contexts/ScoreContext'

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({
      appName: 'BaseBadge',
      preference: 'all',
      jsonRpcUrl: 'https://mainnet.base.org',
      appLogoUrl: 'https://basebadge.xyz/logo.png',
    }),
    metaMask(),
  ],
  ssr: true,
  transports: {
    [base.id]: http(),
  },
})



const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider chain={base}>
          <ScoreProvider>
            {children}
          </ScoreProvider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}