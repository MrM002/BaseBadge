'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gamefi-black via-gamefi-dark to-black">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
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
            </Link>
          </div>
        </nav>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50"
        >
          <h1 className="text-4xl font-bold text-white mb-8">BaseBadge Documentation</h1>
          <p className="text-gray-400 mb-8">Last updated: August 29, 2025</p>
          
          {/* Table of Contents */}
          <div className="mb-12 p-4 bg-black/40 rounded-lg border border-gray-800/50">
            <h2 className="text-xl font-bold text-white mb-4">Contents</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <li>
                <a href="#introduction" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  1. Introduction
                </a>
              </li>
              <li>
                <a href="#architecture" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  2. System Architecture
                </a>
              </li>
              <li>
                <a href="#trust-scores" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  3. Trust Score System
                </a>
              </li>
              <li>
                <a href="#badges" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  4. Badge Mechanics
                </a>
              </li>
              <li>
                <a href="#onchain" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  5. On-Chain Components
                </a>
              </li>
              <li>
                <a href="#api" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  6. API Reference
                </a>
              </li>
              <li>
                <a href="#faq" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  7. FAQ
                </a>
              </li>
              <li>
                <a href="#roadmap" className="text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300">
                  8. Roadmap
                </a>
              </li>
            </ul>
          </div>
          
          <div className="space-y-16 text-gray-300">
            {/* Introduction Section */}
            <section id="introduction">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">1. Introduction</h2>
              </div>
              
              <div className="space-y-6">
                <p>
                  BaseBadge is a decentralized reputation and trust scoring system built on the Base Network. 
                  Our platform analyzes on-chain wallet activity to provide transparent, verifiable trust scores 
                  that help users make informed decisions in the Web3 ecosystem.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                  <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50">
                    <div className="text-gamefi-yellow mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Trust First</h3>
                    <p className="text-gray-400">
                      Enhancing security and trust in Web3 interactions through transparent scoring systems.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50">
                    <div className="text-gamefi-yellow mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Advanced Analytics</h3>
                    <p className="text-gray-400">
                      Sophisticated algorithms analyze on-chain behavior to detect potential risks.
                    </p>
                  </div>
                  
                  <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50">
                    <div className="text-gamefi-yellow mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">Non-Custodial</h3>
                    <p className="text-gray-400">
                      Security by design with no access to private keys or wallet assets.
                    </p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Architecture Section */}
            <section id="architecture">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">2. System Architecture</h2>
              </div>
              
              <div className="space-y-6">
                <p>
                  BaseBadge employs a hybrid architecture that combines off-chain analytics with on-chain verification.
                  This design ensures both scalability and transparency while maintaining the highest security standards.
                </p>
                
                <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50 mt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Key Components</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow">Frontend Application</h4>
                      <p className="mt-1 text-gray-400">
                        Next.js-based reactive interface providing real-time wallet analysis and badge visualization.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow">Backend Services</h4>
                      <p className="mt-1 text-gray-400">
                        Python-based analytics engine that processes blockchain data and calculates trust scores.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow">Smart Contracts</h4>
                      <p className="mt-1 text-gray-400">
                        Solidity contracts deployed on Base Network for on-chain verification of trust scores.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow">Data Storage</h4>
                      <p className="mt-1 text-gray-400">
                        Combination of on-chain storage for verified scores and off-chain databases for detailed analytics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Trust Score Section */}
            <section id="trust-scores">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">3. Trust Score System</h2>
              </div>
              
              <div className="space-y-6">
                <p>
                  Our trust scoring system evaluates wallet addresses based on historical transaction patterns,
                  interaction with flagged contracts, and overall on-chain behavior.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50">
                    <h3 className="text-xl font-semibold text-white mb-4">Score Calculation Factors</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-gamefi-yellow mr-2">•</span>
                        <span>Transaction history and volume</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gamefi-yellow mr-2">•</span>
                        <span>Interaction with known high-risk contracts</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gamefi-yellow mr-2">•</span>
                        <span>Network participation longevity</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gamefi-yellow mr-2">•</span>
                        <span>Diversification of assets and interactions</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gamefi-yellow mr-2">•</span>
                        <span>Connection to known trusted entities</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-gamefi-yellow mr-2">•</span>
                        <span>Unusual activity pattern detection</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50">
                    <h3 className="text-xl font-semibold text-white mb-4">Score Ranges</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">High Trust (80-100)</span>
                          <span className="text-green-400">Excellent</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Medium Trust (50-79)</span>
                          <span className="text-yellow-400">Good</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Low Trust (20-49)</span>
                          <span className="text-orange-400">Caution</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '35%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">Very Low Trust (0-19)</span>
                          <span className="text-red-400">High Risk</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                          <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Badges Section */}
            <section id="badges">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">4. Badge Mechanics</h2>
              </div>
              
              <div className="space-y-6">
                <p>
                  BaseBadge represents trust scores through a system of visual badges that can be displayed
                  on-chain and integrated into various Web3 applications.
                </p>
                
                <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50 mt-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Badge Properties</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow mb-2">Visual Design</h4>
                      <p className="text-gray-400">
                        Dynamic visual elements that adapt to the user's trust score level, providing
                        immediate visual feedback on wallet reputation.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow mb-2">On-Chain Verification</h4>
                      <p className="text-gray-400">
                        Badge authenticity can be verified on-chain through our smart contracts,
                        ensuring tamper-proof representation of trust scores.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow mb-2">Integration Options</h4>
                      <p className="text-gray-400">
                        Badges can be embedded in third-party applications, profiles, and marketplaces
                        through our integration SDK and API.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow mb-2">Score History</h4>
                      <p className="text-gray-400">
                        Each badge contains a historical record of score changes, providing
                        transparency into reputation development over time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* On-Chain Components */}
            <section id="onchain">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">5. On-Chain Components</h2>
              </div>
              
              <div className="space-y-6">
                <p>
                  BaseBadge leverages the security and transparency of the Base Network through
                  a series of smart contracts that verify and store trust score data.
                </p>
                
                <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50 mt-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Smart Contract Architecture</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow">ScoreCheckerUpgradeable</h4>
                      <p className="mt-1 text-gray-400">
                        Core contract for verifying and retrieving trust scores. Implements proxy pattern
                        for upgradeability while maintaining score history.
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Contract Address: 0x1234...5678 (Base Mainnet)
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gamefi-yellow">ScoreCheckerUpgradeableV2</h4>
                      <p className="mt-1 text-gray-400">
                        Enhanced version with additional verification mechanisms and integration
                        capabilities for third-party applications.
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Contract Address: 0x8765...4321 (Base Mainnet)
                      </p>
                    </div>
                    
                    <div className="p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg mt-6">
                      <h4 className="flex items-center text-lg font-medium text-yellow-400 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Security Audit Status
                      </h4>
                      <p className="text-gray-300">
                        All smart contracts have been audited by independent security researchers.
                        Audit reports are available in our GitHub repository.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* API Reference Section */}
            <section id="api">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">6. API Reference</h2>
              </div>
              
              <div className="space-y-6">
                <div className="p-6 bg-blue-900/20 border border-blue-700/40 rounded-lg">
                  <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-white">API Documentation Coming Soon</h3>
                  </div>
                  <p className="text-gray-300">
                    We're currently finalizing our public API documentation. This section will be updated with 
                    comprehensive guides on how to integrate BaseBadge trust scores and badges into your applications.
                  </p>
                  <div className="mt-4 text-gray-400">
                    <p>The API documentation will include:</p>
                    <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                      <li>Authentication methods</li>
                      <li>Endpoints for retrieving trust scores</li>
                      <li>Badge embedding options</li>
                      <li>Webhook notifications for score changes</li>
                      <li>SDK integration guides</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
            
            {/* FAQ Section */}
            <section id="faq">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">7. FAQ</h2>
              </div>
              
              <div className="space-y-6">
                <div className="bg-black/30 p-6 rounded-lg border border-gray-800/50">
                  <div className="divide-y divide-gray-800/50">
                    <div className="py-4">
                      <h3 className="text-xl font-medium text-white mb-2">How accurate are BaseBadge trust scores?</h3>
                      <p className="text-gray-400">
                        Our trust scores are based on verifiable on-chain data and advanced analytics algorithms. 
                        While they provide a reliable indicator of wallet behavior, they should be used as one of 
                        several factors in making decisions about wallet interactions.
                      </p>
                    </div>
                    
                    <div className="py-4">
                      <h3 className="text-xl font-medium text-white mb-2">Can I dispute my trust score?</h3>
                      <p className="text-gray-400">
                        Yes, we provide a dispute resolution process for users who believe their trust score does not 
                        accurately reflect their on-chain behavior. Please contact our support team to initiate this process.
                      </p>
                    </div>
                    
                    <div className="py-4">
                      <h3 className="text-xl font-medium text-white mb-2">How often are trust scores updated?</h3>
                      <p className="text-gray-400">
                        Trust scores are recalculated whenever significant on-chain activity occurs, typically within 
                        minutes of a transaction. Users can also manually trigger a recalculation through our interface.
                      </p>
                    </div>
                    
                    <div className="py-4">
                      <h3 className="text-xl font-medium text-white mb-2">Is BaseBadge open-source?</h3>
                      <p className="text-gray-400">
                        Yes, BaseBadge is an open-source project. Our code repositories are available on GitHub, 
                        allowing for community review and contributions.
                      </p>
                    </div>
                    
                    <div className="py-4">
                      <h3 className="text-xl font-medium text-white mb-2">How can I integrate BaseBadge into my dApp?</h3>
                      <p className="text-gray-400">
                        We provide several integration options including our JavaScript SDK, REST API, and direct 
                        smart contract interactions. Detailed integration guides will be available soon in our API 
                        documentation section.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Roadmap Section */}
            <section id="roadmap">
              <div className="border-l-4 border-gamefi-yellow pl-4 mb-6">
                <h2 className="text-3xl font-bold text-white">8. Roadmap</h2>
              </div>
              
              <div className="space-y-6">
                <p>
                  BaseBadge is continuously evolving to provide better trust and security metrics for the Web3 ecosystem.
                  Here's what's on our development roadmap:
                </p>
                
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-0 md:left-1/2 h-full w-px bg-gamefi-yellow/30"></div>
                  
                  {/* Timeline entries */}
                  <div className="space-y-12">
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:pr-8">
                        <div className="p-4 bg-black/70 rounded-lg border border-gamefi-yellow/30">
                          <h3 className="text-xl font-semibold text-white">Q4 2025</h3>
                          <h4 className="text-lg font-medium text-gamefi-yellow mt-2">Enhanced Analytics Engine</h4>
                          <ul className="mt-2 text-gray-300 space-y-1">
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Advanced pattern recognition for risk detection</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Multi-chain data correlation</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Machine learning model improvements</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="md:hidden h-8 w-8 absolute left-0 top-0 transform -translate-x-1/2 bg-gamefi-yellow rounded-full"></div>
                      <div className="hidden md:block h-8 w-8 absolute left-1/2 top-0 transform -translate-x-1/2 bg-gamefi-yellow rounded-full"></div>
                      <div></div>
                    </div>
                    
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div></div>
                      <div className="md:hidden h-8 w-8 absolute left-0 top-0 transform -translate-x-1/2 bg-gamefi-yellow/80 rounded-full"></div>
                      <div className="hidden md:block h-8 w-8 absolute left-1/2 top-0 transform -translate-x-1/2 bg-gamefi-yellow/80 rounded-full"></div>
                      <div className="md:pl-8">
                        <div className="p-4 bg-black/70 rounded-lg border border-gamefi-yellow/30">
                          <h3 className="text-xl font-semibold text-white">Q1 2026</h3>
                          <h4 className="text-lg font-medium text-gamefi-yellow mt-2">Partnership Integration</h4>
                          <ul className="mt-2 text-gray-300 space-y-1">
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Integration with major DeFi platforms</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Marketplace badge verification systems</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>DAO governance score implementation</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:pr-8">
                        <div className="p-4 bg-black/70 rounded-lg border border-gamefi-yellow/30">
                          <h3 className="text-xl font-semibold text-white">Q2 2026</h3>
                          <h4 className="text-lg font-medium text-gamefi-yellow mt-2">Decentralized Governance</h4>
                          <ul className="mt-2 text-gray-300 space-y-1">
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Community voting on scoring parameters</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Open audit of scoring algorithms</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Reputation staking mechanisms</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div className="md:hidden h-8 w-8 absolute left-0 top-0 transform -translate-x-1/2 bg-gamefi-yellow/60 rounded-full"></div>
                      <div className="hidden md:block h-8 w-8 absolute left-1/2 top-0 transform -translate-x-1/2 bg-gamefi-yellow/60 rounded-full"></div>
                      <div></div>
                    </div>
                    
                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div></div>
                      <div className="md:hidden h-8 w-8 absolute left-0 top-0 transform -translate-x-1/2 bg-gamefi-yellow/40 rounded-full"></div>
                      <div className="hidden md:block h-8 w-8 absolute left-1/2 top-0 transform -translate-x-1/2 bg-gamefi-yellow/40 rounded-full"></div>
                      <div className="md:pl-8">
                        <div className="p-4 bg-black/70 rounded-lg border border-gamefi-yellow/30">
                          <h3 className="text-xl font-semibold text-white">Q3 2026</h3>
                          <h4 className="text-lg font-medium text-gamefi-yellow mt-2">Global Expansion</h4>
                          <ul className="mt-2 text-gray-300 space-y-1">
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Multi-language support</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Regional risk assessment adaptations</span>
                            </li>
                            <li className="flex items-start">
                              <span className="text-gamefi-yellow mr-2 shrink-0">•</span>
                              <span>Cross-chain implementation beyond Base</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-700">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-gamefi-yellow hover:text-gamefi-yellow-light transition-colors duration-300"
            >
              ← Back to BaseBadge
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
