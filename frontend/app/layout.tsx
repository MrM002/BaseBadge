// frontend/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script' // ⬅ added
import '@coinbase/onchainkit/styles.css'
import './globals.css'
import { Providers } from './providers'
import Footer from '../components/Footer'
import LayoutBackgroundWrapper from './LayoutBackgroundWrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BaseBadge - Your Wallet, Your Reputation',
  description:
    'Transform your wallet activity into a dynamic reputation system with TrustScores, gamified badges, and secure reputation NFTs on Base Network.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Early client guard for mobile (incl. “Desktop Mode” on phones) */}
        <Script id="mobile-guard" strategy="beforeInteractive">{`
          (function(){
            try {
              var ua = navigator.userAgent || '';
              var uaMobile = /Mobi|Android|iPhone|iPad|iPod|IEMobile|BlackBerry|BB10|Opera Mini/i.test(ua);
              var chMobile = navigator.userAgentData && navigator.userAgentData.mobile;
              var small = Math.min(window.innerWidth, screen.width) < 800;
              if ((uaMobile || chMobile || small) && location.pathname !== '/mobile-hold') {
                location.replace('/mobile-hold');
              }
            } catch (e) {}
          })();
        `}</Script>
      </head>
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