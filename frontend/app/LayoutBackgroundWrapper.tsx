'use client'

import EnhancedBackground from '../components/EnhancedBackground'
import LightRays from '../components/LightRays'
import { usePathname } from 'next/navigation'

export default function LayoutBackgroundWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  let theme: 'home' | 'dashboard' | 'badge' | 'score' | 'settings' = 'home'
  if (pathname?.startsWith('/dashboard/score-card')) theme = 'score'
  else if (pathname?.startsWith('/dashboard/badge')) theme = 'badge'
  else if (pathname?.startsWith('/dashboard/settings')) theme = 'settings'
  else if (pathname?.startsWith('/dashboard')) theme = 'dashboard'

  const gradientClass =
    theme === 'badge'
      ? 'from-gamefi-dark via-[#1a1200] to-black'
      : theme === 'settings'
      ? 'from-gamefi-dark via-[#0f0a1a] to-black'
      : theme === 'score'
      ? 'from-gamefi-black via-gray-900 to-gamefi-dark-blue'
      : theme === 'dashboard'
      ? 'from-gamefi-black via-gamefi-dark-blue to-black'
      : 'from-gamefi-black via-gamefi-dark to-black'

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${gradientClass}`}>
      {theme === 'home' ? (
        <EnhancedBackground />
      ) : theme === 'score' ? (
        // For score-card, use LightRays with Base blue color and reduced intensity
        <div className="fixed inset-0 z-0">
          <LightRays
            raysOrigin="top-center"
            raysColor="#0052ff"
            raysSpeed={1.2}
            lightSpread={0.6}
            rayLength={1.0}
            followMouse={true}
            mouseInfluence={0.08}
            noiseAmount={0.05}
            distortion={0.03}
            className="w-full h-full"
          />
        </div>
      ) : (
        // For dashboard, badge, and settings - use simple gradients only, no GameFiBackground
        // This prevents conflicts with existing UI/UX and improves performance
        null
      )}
      <div className="relative z-20">
        {children}
      </div>
    </div>
  )
}
