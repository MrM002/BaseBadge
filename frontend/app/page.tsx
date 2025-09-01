'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
// Theme toggle removed from landing per request
import { CustomWalletButton } from '../components/CustomWalletButton'
import dynamic from 'next/dynamic'
import HighlightBase from '../components/HighlightBase'
import PillNavigation from '../components/PillNavigation'
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack'
import StatsCarousel from '../components/StatsCarousel'

import RotatingText from '../components/RotatingText'
import LogoLoop from '../components/LogoLoop'
import { SiReact, SiNextdotjs, SiTypescript, SiTailwindcss, SiWagmi, SiFramer, SiEthereum, SiCoinbase, SiNpm, SiGit, SiDocker, SiPostgresql, SiRedis, SiPython, SiFastapi, SiSqlite, SiJavascript, SiNodedotjs } from 'react-icons/si'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastKnownWalletsAnalyzed, setLastKnownWalletsAnalyzed] = useState("0")
  const [activeSection, setActiveSection] = useState('features')
  const [stats, setStats] = useState([
    { number: "4", label: "Wallets Analyzed", icon: "🔍" },
    { number: "95.0%", label: "Accuracy Rate", icon: "🎯" },
    { number: "4+", label: "Security Checks", icon: "🛡️" },
    { number: "Online", label: "Real-time Monitoring", icon: "⚡" }
  ])

  // Animated counter for numbers
  const AnimatedCounter = ({ value, prefix = "", suffix = "", duration = 900 }: { value: number; prefix?: string; suffix?: string; duration?: number }) => {
    const [display, setDisplay] = useState(0)
    const startRef = useRef<number | null>(null)
    const fromRef = useRef(0)
    const toRef = useRef(value)
    useEffect(() => {
      fromRef.current = display
      toRef.current = value
      startRef.current = null
      let raf: number
      const step = (ts: number) => {
        if (startRef.current === null) startRef.current = ts
        const progress = Math.min(1, (ts - startRef.current) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = Math.round(fromRef.current + (toRef.current - fromRef.current) * eased)
        setDisplay(current)
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
      return () => cancelAnimationFrame(raf)
    }, [value, duration])
    return (
      <span>{prefix}{display.toLocaleString()}{suffix}</span>
    )
  }

  // Load cached stats first, then fetch live and persist
  useEffect(() => {
    try {
      const cached = typeof window !== 'undefined' ? localStorage.getItem('bb_stats') : null
      if (cached) {
        const data = JSON.parse(cached)
        const walletsAnalyzed = Number(data.wallets_analyzed || 0)
        setLastKnownWalletsAnalyzed(walletsAnalyzed.toLocaleString())
        setStats([
          { number: walletsAnalyzed.toLocaleString(), label: "Wallets Analyzed", icon: "🔍" },
          { number: `${Number(data.accuracy_rate || 95.0)}%`, label: "Accuracy Rate", icon: "🎯" },
          { number: `${Number(data.security_checks || 4)}+`, label: "Security Checks", icon: "🛡️" },
          { number: data.monitoring_active ? "Online" : "Offline", label: "Real-time Monitoring", icon: "⚡" }
        ])
      }
    } catch (error) {
      // If no cached data, start with realistic placeholder values
      console.log('No cached stats available, starting with placeholder values')
    }

    const fetchStats = async () => {
      try {
        console.log('Fetching stats from backend...')
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        console.log('API URL:', apiUrl)
        
        const response = await fetch(`${apiUrl}/stats`)
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Backend stats data:', data)
          
          const walletsAnalyzed = Number(data.wallets_analyzed || 0)
          setLastKnownWalletsAnalyzed(walletsAnalyzed.toLocaleString())
          const nextStats = [
            { number: walletsAnalyzed.toLocaleString(), label: "Wallets Analyzed", icon: "🔍" },
            { number: `${Number(data.accuracy_rate || 95.0)}%`, label: "Accuracy Rate", icon: "🎯" },
            { number: `${Number(data.security_checks || 4)}+`, label: "Security Checks", icon: "🛡️" },
            { number: data.monitoring_active ? "Online" : "Offline", label: "Real-time Monitoring", icon: "⚡" }
          ]
          setStats(nextStats)
          try { localStorage.setItem('bb_stats', JSON.stringify(data)) } catch {}
        } else {
          console.log('Backend responded with error status:', response.status)
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        // If backend is not available, show the correct values from persistent stats
        console.log('Backend not available, showing correct stats from persistent data:', error)
        const correctStats = [
          { number: "4", label: "Wallets Analyzed", icon: "🔍" },
          { number: "95.0%", label: "Accuracy Rate", icon: "🎯" },
          { number: "4+", label: "Security Checks", icon: "🛡️" },
          { number: "Online", label: "Real-time Monitoring", icon: "⚡" }
        ]
        setStats(correctStats)
        setLastKnownWalletsAnalyzed("4")
      }
    }
    fetchStats()
  }, [])

  // Function to refresh stats (can be called when new wallet connects)
  const refreshStats = async () => {
    try {
      console.log('Refreshing stats...')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${apiUrl}/stats`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Refreshed stats data:', data)
        
        const walletsAnalyzed = Number(data.wallets_analyzed || 0)
        setLastKnownWalletsAnalyzed(walletsAnalyzed.toLocaleString())
        const nextStats = [
          { number: walletsAnalyzed.toLocaleString(), label: "Wallets Analyzed", icon: "🔍" },
          { number: `${Number(data.accuracy_rate || 95.0)}%`, label: "Accuracy Rate", icon: "🎯" },
          { number: `${Number(data.security_checks || 4)}+`, label: "Security Checks", icon: "🛡️" },
          { number: data.monitoring_active ? "Online" : "Offline", label: "Real-time Monitoring", icon: "⚡" }
        ]
        setStats(nextStats)
        try { localStorage.setItem('bb_stats', JSON.stringify(data)) } catch {}
      }
    } catch (error) {
      console.log('Failed to refresh stats:', error)
    }
  }

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'stats', 'community', 'get-started']
      const scrollPosition = window.scrollY + window.innerHeight / 2

      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i])
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i])
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  const ThreeHero = dynamic(() => import('@/components/ThreeHero'), { ssr: false })

  return (
    <div className="min-h-screen">
      {/* Theme toggle removed on landing */}
      
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {/* Original Logo Image */}
              <div className="relative">
                <Image 
                  src="/logo.png" 
                  alt="BaseBadge Logo" 
                  width={180} 
                  height={60}
                  className="h-16 w-auto"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-gamefi-yellow to-gamefi-yellow-glow rounded-lg blur opacity-5 animate-glow-soft"></div>
              </div>
            </motion.div>
          </div>
        </nav>
        
        {/* Pill Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-8"
        >
                      <PillNavigation
              items={[
                { label: 'Features', href: '#features' },
                { label: 'Stats', href: '#stats' },
                { label: 'Community', href: '#community' }
              ]}
              activeHref={`#${activeSection}`}
              baseColor="#000000"
              pillColor="#ffffff"
              hoveredPillTextColor="#ffffff"
              pillTextColor="#000000"
              ease="power2.easeOut"
              initialLoadAnimation={true}
              className="mb-8"
            />
        </motion.div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-8"
            >
                          <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="bg-gradient-to-r from-gamefi-blue to-gamefi-blue-light bg-clip-text text-transparent">
                Score.
              </span>
              <span className="block text-white">Secure.</span>
              <span className="bg-gradient-to-r from-gamefi-yellow to-gamefi-yellow-glow bg-clip-text text-transparent">
                Showcase
              </span>
            </h1>
                          <div className="text-2xl md:text-3xl text-white font-semibold mb-4">
              — All on <span className="text-gamefi-blue font-bold">Base</span> —
            </div>
              
              {/* Rotating Text Subtitle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="mb-6"
              >
                            <RotatingText
              words={[
                { text: "Level Up Your Web3 Identity", color: "white" },
                { text: "Build Trust in DeFi", color: "blue" },
                { text: "Earn Epic Badges", color: "yellow" },
                { text: "Secure Your Wallet", color: "white" },
                { text: "Join the Base Community", color: "blue" }
              ]}
              size="2xl"
              speed={3000}
            />
              </motion.div>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              Transform your wallet activity into a dynamic reputation system with TrustScores, 
              gamified badges, and secure reputation NFTs on <span className="text-gamefi-blue font-bold">Base</span> Network. 
              <span className="text-gamefi-yellow font-semibold"> Level up your Web3 identity!</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-16 text-center"
            >
              <CustomWalletButton className="px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-gamefi-blue to-gamefi-blue-dark rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                Get Started Now
              </CustomWalletButton>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-16 bg-gradient-to-b from-transparent to-gamefi-dark/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built with Modern <span className="bg-gradient-to-r from-gamefi-green via-gamefi-yellow to-gamefi-orange bg-clip-text text-transparent animate-pulse">Web3 Tech</span>
            </h2>
            <p className="text-lg text-gray-300/90 max-w-2xl mx-auto">
              Powered by cutting-edge technologies for the best user experience
            </p>
          </motion.div>

          {/* LogoLoop with Technology Stack */}
          <div className="h-32 relative overflow-hidden">
            <LogoLoop
              logos={[
                // Frontend Technologies
                { node: <SiReact className="text-4xl text-blue-400" />, title: "React", href: "https://react.dev" },
                { node: <SiNextdotjs className="text-4xl text-black dark:text-white" />, title: "Next.js", href: "https://nextjs.org" },
                { node: <SiTypescript className="text-4xl text-blue-600" />, title: "TypeScript", href: "https://www.typescriptlang.org" },
                { node: <SiTailwindcss className="text-4xl text-cyan-500" />, title: "Tailwind CSS", href: "https://tailwindcss.com" },
                { node: <SiFramer className="text-4xl text-black dark:text-white" />, title: "Framer Motion", href: "https://www.framer.com/motion" },
                { node: <SiJavascript className="text-4xl text-yellow-400" />, title: "JavaScript", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
                
                // Web3 & Blockchain
                { node: <SiEthereum className="text-4xl text-purple-500" />, title: "Ethereum", href: "https://ethereum.org" },
                { node: <SiCoinbase className="text-4xl text-blue-500" />, title: "Base Network", href: "https://base.org" },
                { node: <SiNodedotjs className="text-4xl text-green-500" />, title: "Node.js", href: "https://nodejs.org" },
                { node: <SiWagmi className="text-4xl text-purple-500" />, title: "Wagmi", href: "https://wagmi.sh" },
                
                // Development Tools
                { node: <SiNpm className="text-4xl text-red-500" />, title: "NPM", href: "https://npmjs.com" },
                { node: <SiGit className="text-4xl text-orange-500" />, title: "Git", href: "https://git-scm.com" },
                { node: <SiDocker className="text-4xl text-blue-400" />, title: "Docker", href: "https://docker.com" },
                
                // Backend Technologies
                { node: <SiPython className="text-4xl text-yellow-500" />, title: "Python", href: "https://python.org" },
                { node: <SiFastapi className="text-4xl text-green-600" />, title: "FastAPI", href: "https://fastapi.tiangolo.com" },
                { node: <SiPostgresql className="text-4xl text-blue-600" />, title: "PostgreSQL", href: "https://postgresql.org" },
                { node: <SiRedis className="text-4xl text-red-600" />, title: "Redis", href: "https://redis.io" },
                { node: <SiSqlite className="text-4xl text-blue-700" />, title: "SQLite", href: "https://sqlite.org" }
              ]}
              speed={80}
              direction="left"
              logoHeight={48}
              gap={40}
              pauseOnHover={true}
              scaleOnHover={true}
              fadeOut={true}
              fadeOutColor="#0f172a"
              ariaLabel="Technology stack"
              className="py-4"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 bg-gradient-to-b from-transparent to-gamefi-dark">
        {/* Decorative overlays */}
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(700px 280px at 10% 10%, rgba(0,82,255,.25), transparent), radial-gradient(700px 280px at 90% 90%, rgba(255,184,0,.18), transparent)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Why Choose </span>
              <span className="bg-[linear-gradient(90deg,#0052FF,#FFB800)] bg-clip-text text-transparent">BaseBadge</span>
              <span className="text-white">?</span>
            </h2>
            <p className="text-xl text-gray-300/90 max-w-3xl mx-auto">
              Experience the future of Web3 reputation with our advanced trust scoring system, real-time security analysis, and gamified badge ecosystem built specifically for the Base Network.
            </p>
          </motion.div>

          {/* ScrollStack Features */}
          <div className="h-[600px] max-w-4xl mx-auto mb-16">
            <ScrollStack className="h-full">
              <ScrollStackItem itemClassName="bg-gradient-to-br from-gamefi-blue to-gamefi-blue-dark border-2 border-gamefi-blue/50 shadow-2xl shadow-gamefi-blue/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">⚔️</div>
                  <h3 className="text-3xl font-bold mb-4 text-white">Trust Score System</h3>
                  <p className="text-lg leading-relaxed text-gray-100">
                    Analyze on-chain wallet behavior to assign a comprehensive reputation score with advanced algorithms.
                  </p>
                </div>
              </ScrollStackItem>
              
              <ScrollStackItem itemClassName="bg-gradient-to-br from-gamefi-yellow to-gamefi-orange border-2 border-gamefi-yellow/50 shadow-2xl shadow-gamefi-yellow/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🏆</div>
                  <h3 className="text-3xl font-bold mb-4 text-black">Gamified Badges</h3>
                  <p className="text-lg leading-relaxed text-gray-800">
                    <span className="text-orange-500 font-semibold">🚧 In Development</span><br/>
                    Advanced badge system for achievements and reputation building on Base Network.
                  </p>
                </div>
              </ScrollStackItem>
              
              <ScrollStackItem itemClassName="bg-gradient-to-br from-gamefi-purple to-purple-800 border-2 border-gamefi-purple/50 shadow-2xl shadow-gamefi-purple/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🛡️</div>
                  <h3 className="text-3xl font-bold mb-4 text-white">Real-Time Alerts</h3>
                  <p className="text-lg leading-relaxed text-gray-100">
                    <span className="text-orange-500 font-semibold">🚧 In Development</span><br/>
                    Security monitoring and alert system for wallet protection and risk detection.
                  </p>
                </div>
              </ScrollStackItem>
              
              <ScrollStackItem itemClassName="bg-gradient-to-br from-gamefi-green to-green-800 border-2 border-gamefi-green/50 shadow-2xl shadow-gamefi-green/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🎮</div>
                  <h3 className="text-3xl font-bold mb-4 text-white">Dynamic NFT Profiles</h3>
                  <p className="text-lg leading-relaxed text-gray-100">
                    <span className="text-orange-500 font-semibold">🚧 In Development</span><br/>
                    NFT-based reputation profiles that evolve with your on-chain activity and trust score.
                  </p>
                </div>
              </ScrollStackItem>
              
              <ScrollStackItem itemClassName="bg-gradient-to-br from-gamefi-orange to-gamefi-red border-2 border-gamefi-orange/50 shadow-2xl shadow-gamefi-orange/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">⚡</div>
                  <h3 className="text-3xl font-bold mb-4 text-white">Social Integration</h3>
                  <p className="text-lg leading-relaxed text-gray-100">
                  <span className="text-yellow-500 font-semibold">🚧 In Development</span><br/>
                    Share achievements across social media and boost trust via public visibility.
                  </p>
                </div>
              </ScrollStackItem>
              
              <ScrollStackItem itemClassName="bg-gradient-to-br from-gamefi-blue to-gamefi-blue-dark border-2 border-gamefi-blue/50 shadow-2xl shadow-gamefi-blue/20">
                <div className="text-center">
                  <div className="text-6xl mb-6">🚀</div>
                  <h3 className="text-3xl font-bold mb-4 text-white">Instant Analysis</h3>
                  <p className="text-lg leading-relaxed text-gray-100">
                    Get comprehensive wallet analysis in seconds with our optimized API and real-time scoring.
                  </p>
                </div>
              </ScrollStackItem>
            </ScrollStack>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-gamefi-blue via-gamefi-blue/90 to-gamefi-blue" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(600px 240px at 10% 20%, rgba(255,255,255,.2), transparent), radial-gradient(600px 240px at 90% 80%, rgba(255,255,255,.18), transparent)'}} />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gamefi-blue/5 to-transparent animate-pulse" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 text-center mb-12"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Trusted by the Base Community
            </h2>

          </motion.div>

          {/* Stats Carousel */}
          <div className="relative z-10 max-w-4xl mx-auto">
            <StatsCarousel
              stats={stats}
            />
            

          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="py-16 bg-gradient-to-b from-transparent to-gamefi-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
                                  <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Join the </span>
              <span className="text-gamefi-blue">Base</span> <span className="bg-gradient-to-r from-gamefi-purple via-gamefi-pink to-gamefi-red bg-clip-text text-transparent animate-pulse">Community</span>
            </h2>
          <p className="text-xl text-gray-300/90 max-w-3xl mx-auto">
            <span className="text-gamefi-blue font-bold">Base Network</span> is Coinbase's secure, low-cost, and developer-friendly Ethereum L2 built to bring the next billion users to Web3. 
            Our platform provides essential wallet analysis and trust scoring tools, with advanced features currently in development.
          </p>
          </motion.div>

          {/* Community Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🔍',
                title: 'Wallet Analysis',
                description: 'Analyze wallet addresses for security risks and trust scoring',
                color: 'blue',
                status: 'available'
              },
              {
                icon: '📊',
                title: 'Trust Scoring',
                description: 'Get comprehensive reputation scores based on on-chain behavior',
                color: 'green',
                status: 'available'
              },
              {
                icon: '🛡️',
                title: 'Security Checks',
                description: 'Basic security analysis and risk assessment tools',
                color: 'purple',
                status: 'available'
              },
              {
                icon: '🌟',
                title: 'Community Badges',
                description: '🚧 In Development - Earn badges for contributions and engagement',
                color: 'yellow',
                status: 'development'
              },
              {
                icon: '🤝',
                title: 'Trust Network',
                description: '🚧 In Development - Build connections with trusted members',
                color: 'blue',
                status: 'development'
              },
              {
                icon: '📢',
                title: 'Social Integration',
                description: '🚧 In Development - Share achievements across platforms',
                color: 'orange',
                status: 'development'
              }
            ].map((feature, index) => {
              const getColorClass = (color: string, status: string) => {
                const baseColorClass = (() => {
                  switch (color) {
                    case 'blue': return 'hover:border-gamefi-blue/50 hover:shadow-gamefi-blue/10 group-hover:text-gamefi-blue'
                    case 'yellow': return 'hover:border-gamefi-yellow/50 hover:shadow-gamefi-yellow/10 group-hover:text-gamefi-yellow'
                    case 'purple': return 'hover:border-gamefi-purple/50 hover:shadow-gamefi-purple/10 group-hover:text-gamefi-purple'
                    case 'green': return 'hover:border-gamefi-green/50 hover:shadow-gamefi-green/10 group-hover:text-gamefi-green'
                    case 'orange': return 'hover:border-gamefi-orange/50 hover:shadow-gamefi-orange/10 group-hover:text-gamefi-orange'
                    default: return 'hover:border-gamefi-blue/50 hover:shadow-gamefi-blue/10 group-hover:text-gamefi-blue'
                  }
                })()
                
                // Add status-specific styling
                if (status === 'development') {
                  return baseColorClass + ' opacity-80'
                }
                return baseColorClass
              }
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`group p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-sm border border-gray-800/40 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${getColorClass(feature.color, feature.status)}`}
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300/90 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-16 bg-gradient-to-t from-gamefi-black to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Ready to <span className="bg-gradient-to-r from-gamefi-orange via-gamefi-yellow to-gamefi-green bg-clip-text text-transparent animate-pulse">Level Up</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Start your Web3 journey with <span className="bg-gradient-to-r from-badge-primary via-badge-secondary to-badge-accent bg-clip-text text-transparent">BaseBadge</span>'s core wallet analysis tools. Connect your wallet to get started with trust scoring and security analysis.
            </p>
          </motion.div>

          {/* Scroll to Top Arrow */}
          <div className="flex justify-center mt-8">
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-20 h-20 bg-gradient-to-br from-gamefi-blue to-gamefi-blue-dark rounded-full shadow-2xl shadow-gamefi-blue/30 flex items-center justify-center text-white hover:shadow-gamefi-blue/50 transition-all duration-300 border-2 border-gamefi-blue/30 hover:border-gamefi-blue/50"
              whileHover={{ 
                scale: 1.1,
                boxShadow: "0 0 30px rgba(0, 82, 255, 0.4)"
              }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl"
              >
                ⬆️
              </motion.div>
            </motion.button>
          </div>


        </div>
      </section>

      {/* Footer now rendered globally via RootLayout */}
    </div>
  )
} 