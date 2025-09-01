'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo } from 'react'

type Theme = 'home' | 'dashboard' | 'badge' | 'score' | 'settings'

export default function GameFiBackground({ theme = 'home' as Theme }: { theme?: Theme }) {
  // mouse reactive offset
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 40, damping: 12 })
  const sy = useSpring(my, { stiffness: 40, damping: 12 })
  // mouse-follow ripple (home only)
  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rxs = useSpring(rx, { stiffness: 120, damping: 18 })
  const rys = useSpring(ry, { stiffness: 120, damping: 18 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window
      mx.set(((e.clientX / innerWidth) - 0.5) * 40) // -20..20px
      my.set(((e.clientY / innerHeight) - 0.5) * 40)
      rx.set(e.clientX)
      ry.set(e.clientY)
    }
    const onSoftRefresh = () => {
      // brief opacity pulse to hint refresh without rerendering the page
      try {
        const root = document.getElementById('bb-bg-root')
        if (!root) return
        root.animate([
          { opacity: 0.85 },
          { opacity: 1.0 },
          { opacity: 0.85 },
        ], { duration: 600, easing: 'ease-in-out' })
      } catch {}
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('bb-soft-refresh', onSoftRefresh as EventListener)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('bb-soft-refresh', onSoftRefresh as EventListener)
    }
  }, [mx, my])

  // Theme-specific palettes and blob compositions
  const PALETTES: Record<Theme, Array<{ size: number; blur: number; pos: Partial<Record<'top' | 'left' | 'right' | 'bottom', string>>; bg: string; animate?: any; duration?: number; mouseReactive?: boolean }>> = {
    home: [
      { size: 680, blur: 85, pos: { top: '-12%', left: '-10%' }, bg: 'radial-gradient(circle at 30% 30%, rgba(80, 180, 255, 0.55), transparent 60%)', animate: { x: [0, 70, -30, 0], y: [0, 30, -40, 0], rotate: [0, 10, -8, 0] }, duration: 14, mouseReactive: true },
      { size: 560, blur: 80, pos: { bottom: '-14%', right: '-12%' }, bg: 'radial-gradient(circle at 70% 70%, rgba(255, 120, 120, 0.50), transparent 60%)', animate: { x: [0, -60, 25, 0], y: [0, -28, 22, 0], rotate: [0, -10, 8, 0] }, duration: 16, mouseReactive: true },
      { size: 460, blur: 70, pos: { top: '36%', left: '48%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(160, 200, 255, 0.22), transparent 60%)', animate: { scale: [1, 1.15, 0.92, 1], rotate: [0, 8, -8, 0] }, duration: 12 },
      { size: 320, blur: 60, pos: { top: '12%', right: '14%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 184, 0, 0.30), transparent 60%)', animate: { y: [0, -24, 0, 12, 0] }, duration: 18 },
      { size: 260, blur: 55, pos: { bottom: '20%', left: '10%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(0, 200, 255, 0.28), transparent 60%)', animate: { x: [0, 24, -12, 0] }, duration: 17 },
      { size: 220, blur: 50, pos: { top: '22%', right: '6%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 100, 60, 0.25), transparent 60%)', animate: { x: [0, -18, 8, 0], y: [0, -10, 6, 0] }, duration: 16 },
      { size: 200, blur: 48, pos: { bottom: '30%', left: '24%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(80, 255, 200, 0.22), transparent 60%)', animate: { y: [0, 14, -8, 0] }, duration: 19 },
      { size: 180, blur: 46, pos: { top: '58%', right: '22%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 240, 180, 0.20), transparent 60%)', animate: { x: [0, 10, -6, 0] }, duration: 20 },
    ],
    dashboard: [
      { size: 640, blur: 80, pos: { top: '-12%', left: '-10%' }, bg: 'radial-gradient(circle at 30% 30%, rgba(0, 140, 255, 0.55), transparent 60%)', animate: { x: [0, 80, -30, 0], y: [0, 30, -40, 0], rotate: [0, 10, -8, 0] }, duration: 14, mouseReactive: true },
      { size: 560, blur: 80, pos: { bottom: '-14%', right: '-10%' }, bg: 'radial-gradient(circle at 70% 70%, rgba(255, 80, 80, 0.50), transparent 60%)', animate: { x: [0, -70, 30, 0], y: [0, -35, 25, 0], rotate: [0, -12, 10, 0] }, duration: 16, mouseReactive: true },
      { size: 500, blur: 70, pos: { top: '30%', left: '55%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(140, 120, 255, 0.25), transparent 60%)', animate: { scale: [1, 1.15, 0.92, 1], rotate: [0, 8, -8, 0] }, duration: 12 },
      { size: 280, blur: 60, pos: { top: '15%', right: '10%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 184, 0, 0.28), transparent 60%)', animate: { y: [0, -25, 0, 15, 0] }, duration: 18 },
      { size: 240, blur: 60, pos: { bottom: '18%', left: '20%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(0, 200, 160, 0.35), transparent 60%)', animate: { x: [0, 20, -10, 0] }, duration: 20 },
    ],
    badge: [
      { size: 680, blur: 90, pos: { top: '-14%', left: '-12%' }, bg: 'radial-gradient(circle at 30% 30%, rgba(255, 200, 0, 0.55), transparent 60%)', animate: { x: [0, 70, -20, 0], y: [0, 20, -30, 0], rotate: [0, 8, -6, 0] }, duration: 14, mouseReactive: true },
      { size: 580, blur: 90, pos: { bottom: '-16%', right: '-10%' }, bg: 'radial-gradient(circle at 70% 70%, rgba(0, 200, 120, 0.50), transparent 60%)', animate: { x: [0, -60, 25, 0], y: [0, -25, 15, 0], rotate: [0, -10, 8, 0] }, duration: 16, mouseReactive: true },
      { size: 520, blur: 80, pos: { top: '28%', left: '55%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 140, 0.22), transparent 60%)', animate: { scale: [1, 1.2, 0.9, 1] }, duration: 13 },
      { size: 300, blur: 60, pos: { top: '12%', right: '12%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 184, 0, 0.35), transparent 60%)', animate: { y: [0, -30, 5, 0] }, duration: 18 },
      { size: 260, blur: 55, pos: { bottom: '20%', left: '18%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 100, 60, 0.30), transparent 60%)', animate: { x: [0, 25, -10, 0] }, duration: 19 },
    ],
    score: [
      { size: 640, blur: 85, pos: { top: '-12%', left: '-10%' }, bg: 'radial-gradient(circle at 30% 30%, rgba(0, 200, 160, 0.55), transparent 60%)', animate: { x: [0, 70, -20, 0], y: [0, 25, -30, 0], rotate: [0, 10, -8, 0] }, duration: 15, mouseReactive: true },
      { size: 560, blur: 85, pos: { bottom: '-14%', right: '-10%' }, bg: 'radial-gradient(circle at 70% 70%, rgba(255, 90, 120, 0.50), transparent 60%)', animate: { x: [0, -60, 25, 0], y: [0, -25, 20, 0], rotate: [0, -12, 10, 0] }, duration: 17, mouseReactive: true },
      { size: 500, blur: 70, pos: { top: '30%', left: '52%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(120, 220, 200, 0.22), transparent 60%)', animate: { scale: [1, 1.18, 0.92, 1] }, duration: 12 },
      { size: 280, blur: 60, pos: { top: '14%', right: '12%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(0, 200, 255, 0.30), transparent 60%)', animate: { y: [0, -20, 0, 12, 0] }, duration: 18 },
      { size: 240, blur: 55, pos: { bottom: '18%', left: '20%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 184, 0, 0.28), transparent 60%)', animate: { x: [0, 20, -10, 0] }, duration: 19 },
    ],
    settings: [
      { size: 620, blur: 85, pos: { top: '-12%', left: '-10%' }, bg: 'radial-gradient(circle at 30% 30%, rgba(160, 130, 255, 0.55), transparent 60%)', animate: { x: [0, 70, -25, 0], y: [0, 25, -35, 0], rotate: [0, 10, -8, 0] }, duration: 15, mouseReactive: true },
      { size: 540, blur: 85, pos: { bottom: '-14%', right: '-10%' }, bg: 'radial-gradient(circle at 70% 70%, rgba(255, 140, 200, 0.45), transparent 60%)', animate: { x: [0, -60, 25, 0], y: [0, -25, 18, 0], rotate: [0, -10, 8, 0] }, duration: 17, mouseReactive: true },
      { size: 480, blur: 70, pos: { top: '32%', left: '50%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(180, 160, 255, 0.22), transparent 60%)', animate: { scale: [1, 1.15, 0.92, 1], rotate: [0, 6, -6, 0] }, duration: 12 },
      { size: 260, blur: 60, pos: { top: '16%', right: '14%' }, bg: 'radial-gradient(circle at 50% 50%, rgba(255, 184, 0, 0.22), transparent 60%)', animate: { y: [0, -22, 0, 10, 0] }, duration: 18 },
    ],
  }

  // Theme-specific extra overlays
  const OVERLAYS: Record<Theme, JSX.Element | null> = {
    home: (
      <>
        {/* Corner halos (no visible hard lines) */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(900px 360px at -10% -10%, rgba(80, 180, 255, .10), transparent), radial-gradient(800px 320px at 110% -10%, rgba(255, 184, 0, .08), transparent), radial-gradient(900px 360px at -10% 110%, rgba(0, 200, 255, .08), transparent), radial-gradient(800px 320px at 110% 110%, rgba(255, 120, 120, .08), transparent)'
        }} />
      </>
    ),
    dashboard: (
      <>
        <div className="absolute left-0 top-1/4 h-1/2 w-[2px] bg-gradient-to-b from-gamefi-blue/40 via-white/10 to-transparent" />
        <div className="absolute right-0 top-1/3 h-1/2 w-[2px] bg-gradient-to-b from-gamefi-yellow/40 via-white/10 to-transparent" />
      </>
    ),
    badge: (
      <>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(1000px 400px at 20% -10%, rgba(255, 184, 0, .08), transparent), radial-gradient(800px 320px at 80% 110%, rgba(0, 200, 120, .06), transparent)'
        }} />
      </>
    ),
    score: (
      <>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(900px 360px at 10% 0%, rgba(0, 200, 160, .07), transparent), radial-gradient(700px 280px at 90% 100%, rgba(255, 100, 140, .06), transparent)'
        }} />
      </>
    ),
    settings: (
      <>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(900px 360px at 0% 10%, rgba(160, 130, 255, .08), transparent), radial-gradient(700px 280px at 100% 90%, rgba(255, 140, 200, .06), transparent)'
        }} />
      </>
    ),
  }

  const containerOpacity = theme === 'home' ? 0.96 : 0.9
  // NOTE: Logo rain disabled per request
  const logoRain: Array<{ left: string; size: number; duration: number; delay: number; opacity: number; rotate: number; blur: number }> = []
  return (
    <div id="bb-bg-root" aria-hidden className="pointer-events-none fixed inset-0 z-10 overflow-hidden mix-blend-screen" style={{ opacity: containerOpacity }}>
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 55%, transparent 100%)',
        }}
      />

      {/* Animated glow blobs per-theme */}
      {PALETTES[theme].map((blob, idx) => (
        <motion.div
          key={`${theme}-${idx}`}
          className="absolute rounded-full"
          style={{
            height: `${blob.size}px`,
            width: `${blob.size}px`,
            filter: `blur(${blob.blur}px)`,
            background: blob.bg,
            ...(blob.pos.top ? { top: blob.pos.top } : {}),
            ...(blob.pos.left ? { left: blob.pos.left } : {}),
            ...(blob.pos.right ? { right: blob.pos.right } : {}),
            ...(blob.pos.bottom ? { bottom: blob.pos.bottom } : {}),
            x: blob.mouseReactive ? (sx as unknown as number) : undefined,
            y: blob.mouseReactive ? (sy as unknown as number) : undefined,
          }}
          animate={blob.animate || { scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: blob.duration || 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Logo rain removed */}

      {/* Mouse-follow ripple on all pages (RGB, higher opacity, directly under cursor) */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: rx as unknown as number,
          top: ry as unknown as number,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle at center, rgba(0,255,255,0.38) 0%, rgba(0,255,255,0.15) 45%, transparent 70%)',
          filter: 'blur(4px) hue-rotate(0deg) saturate(2)',
          opacity: 0.5, // Reduced opacity to 50%
          mixBlendMode: 'screen',
          zIndex: 1000,
          pointerEvents: 'none',
          userSelect: 'none',
          touchAction: 'none',
          willChange: 'transform, opacity',
          transformOrigin: 'center center',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
        }}
        animate={{
          filter: ['blur(4px) hue-rotate(0deg) saturate(2)', 'blur(4px) hue-rotate(360deg) saturate(2)'],
          scale: [0.98, 1.06, 1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      {/* Extra themed overlays */}
      {OVERLAYS[theme]}
    </div>
  )
}


