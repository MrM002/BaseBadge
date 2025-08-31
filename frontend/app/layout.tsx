import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@coinbase/onchainkit/styles.css'
import './globals.css'
import { Providers } from './providers'
import Footer from '../components/Footer'
import LayoutBackgroundWrapper from './LayoutBackgroundWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BaseBadge - Your Wallet, Your Reputation',
  description: 'Transform your wallet activity into a dynamic reputation system with TrustScores, gamified badges, and secure reputation NFTs on Base Network.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <LayoutBackgroundWrapper>
            {children}
            <Footer />
          </LayoutBackgroundWrapper>
        </Providers>
      </body>
    </html>
  )
} 
 
