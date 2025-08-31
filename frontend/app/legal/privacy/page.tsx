'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function PrivacyPage() {
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800/50"
        >
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          <p className="text-gray-400 mb-6">Last updated: August 29, 2025</p>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="mb-3">
                BaseBadge ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Web3 reputation and 
                trust scoring platform built on the Base Network.
              </p>
              <p className="mb-3">
                BaseBadge acts as the data controller for personal data processed in connection with the Services. 
                Contact: <a href="mailto:0x0mr0m0@gmail.com" className="text-gamefi-yellow hover:underline">0x0mr0m0@gmail.com</a>
              </p>
              <p>
                We have endeavored to align our policies with the principles of GDPR, CCPA, and similar regulations. 
                However, due to our geographical location and project structure, we do not have direct legal obligations 
                under these specific regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-semibold text-white mb-2">2.1 Public Blockchain Data</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Public wallet addresses and transaction history</li>
                <li>On-chain activity and smart contract interactions</li>
                <li>Token balances and NFT holdings (publicly visible)</li>
                <li>Gas fees and transaction timestamps</li>
                <li>Contract addresses and function calls</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">2.2 User-Provided Information</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Wallet connection preferences and settings</li>
                <li>Custom badge preferences and display choices</li>
                <li>Communication preferences and notification settings</li>
                <li>Feedback and support requests</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">2.3 Technical and Analytics Data</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>IP addresses and geolocation data (anonymized)</li>
                <li>Browser type, version, and device information</li>
                <li>Usage patterns and service interaction metrics</li>
                <li>Performance data and error logs</li>
                <li>Session duration and feature usage statistics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Legal Basis for Processing (Where Required)</h2>
              <p className="mb-3">Where you are located in jurisdictions that require a legal basis (e.g., the EEA under GDPR), we rely on:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Legitimate Interests:</strong> Providing wallet analysis and security services</li>
                <li><strong>Contract:</strong> To deliver requested features</li>
                <li><strong>Legal Obligations:</strong> Where applicable</li>
                <li><strong>Consent:</strong> For optional features and marketing communications</li>
              </ul>
              <p className="mt-3">
                Outside such jurisdictions, we process data as described in this Policy in accordance with applicable local laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. How We Use Information</h2>
              <p className="mb-3">We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Service Provision:</strong> Calculate trust scores and provide security analysis</li>
                <li><strong>Platform Improvement:</strong> Enhance user experience and service quality</li>
                <li><strong>Security:</strong> Prevent fraud, abuse, and ensure platform safety</li>
                <li><strong>Compliance:</strong> Meet legal and regulatory requirements</li>
                <li><strong>Communication:</strong> Provide updates and support services</li>
                <li><strong>Analytics:</strong> Understand usage patterns and optimize performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Processing & Storage</h2>
              <h3 className="text-lg font-semibold text-white mb-2">5.1 Processing Principles</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Data minimization and purpose limitation</li>
                <li>Transparency and accountability</li>
                <li>Security by design and default</li>
                <li>Regular data protection impact assessments</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">5.2 Storage and Retention</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Data is stored securely using industry-standard encryption</li>
                <li>Retention periods are based on legal requirements and business needs</li>
                <li>Automated deletion of expired or unnecessary data</li>
                <li>Regular review and cleanup of stored information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Third-Party Services & Integrations</h2>
              <p className="mb-3">We integrate with the following services for enhanced functionality:</p>
              
              <h3 className="text-lg font-semibold text-white mb-2">6.1 Blockchain Services</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Base Network:</strong> Core blockchain infrastructure and data</li>
                <li><strong>Etherscan:</strong> Transaction data and contract verification</li>
                <li><strong>Alchemy:</strong> Advanced blockchain analytics and indexing</li>
                <li><strong>Blockscout:</strong> Base Network specific data and explorer</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">6.2 Web3 Infrastructure</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Coinbase OnchainKit:</strong> Wallet connection and authentication</li>
                <li><strong>Wagmi:</strong> React hooks for Ethereum interactions</li>
                <li><strong>Zerion:</strong> Portfolio and token data aggregation</li>
              </ul>
              
              <p className="mt-3 text-sm text-gray-400">
                Each third-party service maintains its own privacy policy and terms of service. 
                We recommend reviewing their policies for complete information. 
                Use of these services is solely for analytical service provision, and BaseBadge 
                has no control over their policies or practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights & Choices</h2>
              <h3 className="text-lg font-semibold text-white mb-2">7.1 GDPR Rights (EU Users)</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Right of Access:</strong> Request information about your data</li>
                <li><strong>Right of Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li><strong>Right to Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Restriction:</strong> Limit how we process your data</li>
                <li><strong>Right to Withdraw Consent:</strong> Revoke consent for optional processing</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">7.2 CCPA Rights (California Users)</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Right to Know:</strong> Information about data collection and use</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of data sales (we do not sell data)</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of privacy choices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Data Security & Protection</h2>
              <p className="mb-3">We implement reasonable technical and organizational measures to protect your information, including:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Encryption:</strong> Data encryption in transit and reasonable storage protection</li>
                <li><strong>Access Controls:</strong> Role-based access control and authentication measures</li>
                <li><strong>Network Security:</strong> Firewalls and network hardening measures</li>
                <li><strong>Security Monitoring:</strong> Regular security assessments and monitoring</li>
                <li><strong>Incident Response:</strong> Procedures for addressing security incidents</li>
                <li><strong>Best Practices:</strong> Following industry security standards</li>
              </ul>
              <p className="mt-3">
                While we strive to safeguard data, no method of transmission or storage is completely secure, 
                and we cannot guarantee absolute security.
              </p>
              
              <div className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
                <p className="text-red-300 font-semibold mb-2">⚠️ CRITICAL SECURITY NOTICE:</p>
                <p className="text-red-200 text-sm leading-relaxed">
                  <strong>Wallet Security is Your Responsibility:</strong> While we implement reasonable security measures 
                  for our platform, the ultimate responsibility for securing your wallet, private keys, and digital assets 
                  rests entirely with you. We cannot and do not guarantee the security of your wallet or protect against 
                  user error, phishing attacks, or other security threats. Always use best practices for wallet security, 
                  including secure storage of private keys, enabling 2FA where available, and verifying all transactions 
                  before signing. We never request, collect, or store your private keys, seed phrases, or custodial access.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. International Data Transfers</h2>
              <p className="mb-3">Where international data transfers occur, we use appropriate safeguards required by applicable law:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Transfer Mechanisms:</strong> Standard contractual clauses and other approved mechanisms</li>
                <li><strong>Legal Compliance:</strong> Following applicable data transfer regulations</li>
                <li><strong>Transparency:</strong> Clear information about transfer locations and protections</li>
                <li><strong>Appropriate Safeguards:</strong> Implementing measures required by applicable law</li>
              </ul>
              <p className="mt-3">
                We provide transparency about transfer locations and protections, where relevant.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Cookies & Tracking Technologies</h2>
              <p className="mb-3">We use cookies for essential functionality:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Essential Cookies:</strong> Authentication, security, and basic functionality</li>
                <li><strong>Analytics Cookies:</strong> Performance monitoring and service improvement (with consent where required)</li>
                <li><strong>Preference Cookies:</strong> User settings and customization options</li>
                <li><strong>Third-Party Cookies:</strong> Integration with blockchain and Web3 services</li>
              </ul>
              <p className="mt-3">
                Analytics and preference cookies are used with your consent where required by law. 
                You can manage cookies in your browser or via our cookie banner/settings. 
                Disabling certain cookies may impact functionality.
              </p>
              <p className="mt-3 text-blue-300">
                We currently do not use third-party advertising cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Children's Privacy</h2>
              <p>
                BaseBadge is not intended for users under 18 years of age. We do not knowingly collect personal information from children. 
                This restriction is particularly important for services involving wallet connections or financial transactions. 
                If you believe we have collected information from a child, please contact us immediately for removal.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Data Breach Notification</h2>
              <p className="mb-3">If a data incident occurs affecting your personal information:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>We will assess the impact and scope of the incident</li>
                <li>We will notify users and/or authorities as required by applicable law</li>
                <li>We will provide information about the incident and mitigation measures</li>
                <li>We will take reasonable steps to prevent similar incidents</li>
              </ul>
              <p className="mt-3">
                We will assess impact and notify users and/or authorities as required by applicable law 
                and as promptly as reasonably possible.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Privacy Policy</h2>
              <p className="mb-3">We may update this Privacy Policy to reflect:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>New features and service offerings</li>
                <li>Changes in applicable laws and regulations</li>
                <li>Improvements in data protection practices</li>
                <li>Feedback from users and regulatory bodies</li>
              </ul>
              <p className="mt-3">
                Significant changes will be communicated through our platform, email notifications, 
                and prominent website announcements. Continued use constitutes acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
              <p className="mb-3">For privacy inquiries or requests, contact:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Project Builder:</strong> <a href="mailto:0x0mr0m0@gmail.com" className="text-gamefi-yellow hover:underline">0x0mr0m0@gmail.com</a></li>
                <li><strong>GitHub Repository:</strong> <a href="https://github.com/MrM002/BaseBadge" className="text-gamefi-yellow hover:underline">@MrM002/BaseBadge</a></li>
                <li><strong>Farcaster:</strong> <a href="https://farcaster.xyz/basebadge" className="text-gamefi-yellow hover:underline">@basebadge</a></li>
                <li><strong>Response Time:</strong> We aim to respond within 30 days where legally required</li>
                <li><strong>Verification:</strong> We may require non-transactional message signing to verify wallet ownership before fulfilling requests</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                <strong>Note:</strong> We have not appointed a Data Protection Officer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Regulatory Compliance</h2>
              <p className="mb-3">BaseBadge endeavors to align with the following regulations and frameworks:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>GDPR:</strong> European Union General Data Protection Regulation principles</li>
                <li><strong>CCPA:</strong> California Consumer Privacy Act principles</li>
                <li><strong>ePrivacy Directive:</strong> EU electronic communications privacy principles</li>
                <li><strong>Base Network:</strong> Coinbase L2 governance and best practices</li>
                <li><strong>Web3 Standards:</strong> Decentralized identity and privacy best practices</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                <strong>Important Note:</strong> This project is experimental/educational and non-custodial. 
                We do not offer financial, investment, or legal services. Users are responsible for compliance 
                with their local laws and must not use the service where prohibited.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700">
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