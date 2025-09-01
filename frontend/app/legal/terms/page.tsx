'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          <p className="text-gray-400 mb-6">Last updated: August 29, 2025</p>
          
          <div className="space-y-6 text-gray-300">
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
              <p className="mb-3">
                These Terms of Service ("Terms," "Agreement," or "Terms of Service") constitute a legally binding agreement between you 
                ("User," "you," or "your") and BaseBadge ("Company," "we," "us," or "our") regarding your use of our Web3 reputation 
                and trust scoring platform built on the Base Network.
              </p>
              <p className="mb-3">
                By accessing, using, or interacting with BaseBadge, you acknowledge that you have read, understood, and agree to be bound 
                by these Terms. If you do not agree to these Terms, you must not use our services.
              </p>
              <p>
                These Terms are effective as of the date of your first use of the service and will remain in effect until terminated 
                in accordance with the provisions herein.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description & Scope</h2>
              <p className="mb-3">
                BaseBadge is a decentralized Web3 platform that provides comprehensive wallet reputation scoring, security analysis, 
                and gamified badge systems on the Base Network. Our services include but are not limited to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Trust Score Calculation:</strong> Advanced algorithmic analysis of on-chain wallet behavior</li>
                <li><strong>Security Risk Assessment:</strong> Real-time detection of suspicious activities and potential threats</li>
                <li><strong>Gamified Badge System:</strong> Achievement-based reputation tokens and NFT profiles</li>
                <li><strong>Real-Time Monitoring:</strong> Continuous wallet activity tracking and alert systems</li>
                <li><strong>Community Integration:</strong> Social features and reputation sharing capabilities</li>
                <li><strong>API Services:</strong> Programmatic access to reputation and security data</li>
              </ul>
              <p className="mt-3">
                Our services are designed to enhance the security and trustworthiness of the Base Network ecosystem while providing 
                users with valuable insights into their Web3 reputation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. Eligibility & User Requirements</h2>
              <h3 className="text-lg font-semibold text-white mb-2">3.1 Age Requirements</h3>
              <p className="mb-3">
                You must be at least 18 years old to use BaseBadge. By using our services, you represent and warrant that you are 
                of legal age to form a binding contract and meet all eligibility requirements.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">3.2 Legal Capacity</h3>
              <p className="mb-3">
                You must have the legal capacity to enter into these Terms. If you are using our services on behalf of an entity, 
                you represent that you have the authority to bind that entity to these Terms.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">3.3 Jurisdictional Compliance</h3>
              <p className="mb-3">
                Your use of BaseBadge must comply with all applicable laws and regulations in your jurisdiction. You are responsible 
                for ensuring that your use of our services is lawful in your location.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">3.4 Sanctions & Local Law</h3>
              <p className="mb-3">
                You represent that your use of the services is not prohibited by applicable export control, sanctions, or local laws. 
                You are solely responsible for compliance with laws in your jurisdiction and must not access or use the services 
                where such use is restricted or prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. User Responsibilities & Conduct</h2>
              <p className="mb-3">As a user of BaseBadge, you agree to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Provide Accurate Information:</strong> Submit valid wallet addresses and truthful information for analysis</li>
                <li><strong>Maintain Security:</strong> Protect your wallet connections and prevent unauthorized access</li>
                <li><strong>Comply with Laws:</strong> Use our services in accordance with applicable laws and regulations</li>
                <li><strong>Respect Platform Integrity:</strong> Not attempt to manipulate or game the scoring system</li>
                <li><strong>Report Issues:</strong> Notify us of any security vulnerabilities or suspicious activities</li>
                <li><strong>Accept Limitations:</strong> Understand that scores are informational and not financial advice</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">4.1 Prohibited Activities</h3>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Use our services for illegal or unauthorized purposes</li>
                <li>Attempt to reverse engineer or compromise our platform</li>
                <li>Interfere with other users' access to our services</li>
                <li>Distribute malware or engage in cyber attacks</li>
                <li>Violate intellectual property rights or privacy laws</li>
                <li>Engage in fraudulent or deceptive practices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Privacy & Security</h2>
              <p className="mb-3">
                We are committed to protecting your privacy and maintaining the security of your information. Our data practices 
                are governed by our comprehensive Privacy Policy, which is incorporated into these Terms by reference.
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>No Private Key Storage:</strong> We never store, access, or transmit your private keys</li>
                <li><strong>Public Data Only:</strong> Analysis is performed using publicly available blockchain data</li>
                <li><strong>Privacy Principles:</strong> We align with global privacy principles and, where required (e.g., EEA), apply appropriate legal bases. See our Privacy Policy.</li>
                <li><strong>Data Minimization:</strong> We collect only necessary information for service provision</li>
                <li><strong>Security Measures:</strong> Industry-standard encryption and security protocols</li>
                <li><strong>User Rights:</strong> Full access to your data and control over its use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Third-Party Services & Integrations</h2>
              <p className="mb-3">
                BaseBadge integrates with various blockchain services and Web3 infrastructure providers to deliver comprehensive 
                functionality. These integrations include:
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2">6.1 Blockchain Infrastructure</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Base Network:</strong> Coinbase's Ethereum L2 for core blockchain operations</li>
                <li><strong>Etherscan:</strong> Transaction data and smart contract verification services</li>
                <li><strong>Alchemy:</strong> Advanced blockchain analytics and indexing solutions</li>
                <li><strong>Blockscout:</strong> Base Network specific data and explorer functionality</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">6.2 Web3 Development Tools</h3>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Coinbase OnchainKit:</strong> Secure wallet connection and authentication</li>
                <li><strong>Wagmi:</strong> React hooks for Ethereum and Base Network interactions</li>
                <li><strong>Zerion:</strong> Portfolio and token data aggregation services</li>
              </ul>
              
              <p className="mt-3 text-sm text-gray-400">
                Each third-party service maintains its own terms of service and privacy policy. Users acknowledge that these 
                services operate independently and may have different legal frameworks and requirements. 
                Use of these services is solely for analytical service provision, and BaseBadge has no control over their policies or practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property & Licensing</h2>
              <h3 className="text-lg font-semibold text-white mb-2">7.1 Our Intellectual Property</h3>
              <p className="mb-3">
                BaseBadge and its original content, features, and functionality are owned by us and are protected by international 
                copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">7.2 User-Generated Content</h3>
              <p className="mb-3">
                You retain ownership of any content you create or submit to our platform. By submitting content, you grant us a 
                non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with our services.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">7.3 Open Source Components</h3>
              <p className="mb-3">
                Our platform incorporates open-source software components. These components are subject to their respective open-source 
                licenses, which are available upon request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Disclaimers & Limitations</h2>
              <h3 className="text-lg font-semibold text-white mb-2">8.1 Service Availability</h3>
              <p className="mb-3">
                BaseBadge is provided "as is" and "as available" without warranties of any kind. We do not guarantee uninterrupted 
                service availability or error-free operation.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">8.2 Information Accuracy</h3>
              <p className="mb-3">
                While we strive for accuracy, our analysis and scoring systems are for informational purposes only. We do not guarantee 
                the accuracy, completeness, or reliability of any information provided through our services.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">8.3 Financial & Legal Advice</h3>
              <p className="mb-3">
                BaseBadge does not provide financial, investment, or legal advice. Our services are tools for information and analysis. 
                Users should consult qualified professionals for financial and legal decisions.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">8.4 Security Guarantees</h3>
              <p className="mb-3">
                While we implement reasonable security measures, no method is completely secure. You are responsible for safeguarding 
                your wallet(s) and following Web3 best practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
              <p className="mb-3">
                To the maximum extent permitted by applicable law, BaseBadge shall not be liable for any indirect, incidental, 
                special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Loss of profits, revenue, or business opportunities</li>
                <li>Data loss or corruption</li>
                <li>Service interruptions or downtime</li>
                <li>Third-party service failures or issues</li>
                <li>Security breaches or unauthorized access</li>
                <li>Regulatory compliance issues</li>
              </ul>
              <p className="mt-3">
                Our total liability to you for any claims arising from these Terms or your use of our services shall not exceed 
                the amount you paid us in the twelve months preceding the claim.
              </p>
              <p className="mt-3 text-sm text-gray-400">
                <strong>Important Note:</strong> This platform operates as an experimental/educational project and does not provide 
                formal financial or investment services. Users are responsible for their own use of the data provided and should 
                not rely on our analysis for financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
              <p className="mb-3">
                You agree to indemnify, defend, and hold harmless BaseBadge and its officers, directors, employees, agents, and 
                affiliates from and against any claims, damages, losses, liabilities, costs, and expenses (including reasonable 
                attorneys' fees) arising from:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Your use of our services in violation of these Terms</li>
                <li>Your violation of any applicable laws or regulations</li>
                <li>Your infringement of third-party rights</li>
                <li>Your provision of false or misleading information</li>
                <li>Any unauthorized access to or use of our services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Governing Law & Dispute Resolution</h2>
              <p className="mb-3">
                These Terms are a binding agreement between you and BaseBadge. Unless a mandatory law in your jurisdiction 
                requires otherwise, these Terms are governed by the laws of the Netherlands, excluding its conflict of law rules.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">11.1 Dispute Resolution</h3>
              <p className="mb-3">
                Any dispute arising out of or in connection with these Terms shall first be addressed through good-faith negotiations. 
                If not resolved within 30 days, the dispute shall be settled as follows:
              </p>
              
              <div className="ml-4 space-y-3">
                <p className="text-gray-300">
                  <strong>Primary Resolution:</strong> Unless required by mandatory law in your jurisdiction, disputes shall be 
                  settled under Dutch law and arbitration under the Rules of the Netherlands Arbitration Institute (NAI). 
                  Seat: Amsterdam, Netherlands. Language: English.
                </p>
                
                <p className="text-gray-300">
                  <strong>Jurisdictional Compliance:</strong> If your jurisdiction has mandatory laws that require different 
                  dispute resolution procedures, those laws will take precedence over our standard arbitration clause.
                  If mandatory consumer protection laws in your jurisdiction grant you the right to bring claims in local courts, 
                  those rights remain unaffected.
                </p>
                
                <p className="text-gray-300">
                  <strong>Costs:</strong> Each party bears its own costs unless the tribunal decides otherwise.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Termination & Suspension</h2>
              <h3 className="text-lg font-semibold text-white mb-2">12.1 Termination by User</h3>
              <p className="mb-3">
                You may terminate your use of BaseBadge at any time by discontinuing use of our services. Upon termination, 
                your right to use our services will cease immediately.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">12.2 Termination by Us</h3>
              <p className="mb-3">
                We may terminate or suspend your access to our services at any time, with or without cause, including for:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activities</li>
                <li>Security threats or abuse</li>
                <li>Extended periods of inactivity</li>
                <li>Legal or regulatory requirements</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">12.3 Effect of Termination</h3>
              <p className="mb-3">
                Upon termination, your right to use our services ceases, and we may delete or anonymize your data in accordance 
                with our Privacy Policy and applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
              <p className="mb-3">
                We reserve the right to modify these Terms at any time. Changes may be made to reflect:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>New features and service offerings</li>
                <li>Changes in applicable laws and regulations</li>
                <li>Improvements in security and privacy practices</li>
                <li>Feedback from users and regulatory bodies</li>
                <li>Evolving Web3 and blockchain standards</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">13.1 Notification of Changes</h3>
              <p className="mb-3">
                Significant changes will be communicated through our platform, email notifications, and prominent website announcements. 
                Continued use of our services after changes constitutes acceptance of the updated Terms.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">13.2 Service Modification or Discontinuation</h3>
              <p className="mb-3">
                We may modify, suspend, or discontinue any part of the Services at any time without liability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Force Majeure</h2>
              <p className="mb-3">
                BaseBadge shall not be liable for any failure to perform its obligations under these Terms due to circumstances 
                beyond our reasonable control, including but not limited to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Natural disasters and extreme weather events</li>
                <li>Government actions and regulatory changes</li>
                <li>Blockchain network disruptions or failures</li>
                <li>Third-party service outages or failures</li>
                <li>Cybersecurity incidents and attacks</li>
                <li>Pandemics and public health emergencies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Severability & Waiver</h2>
              <h3 className="text-lg font-semibold text-white mb-2">15.1 Severability</h3>
              <p className="mb-3">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated 
                to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
              </p>
              
              <h3 className="text-lg font-semibold text-white mb-2 mt-4">15.2 Waiver</h3>
              <p className="mb-3">
                The failure of BaseBadge to exercise or enforce any right or provision of these Terms shall not constitute a waiver 
                of such right or provision. Any waiver must be in writing and signed by an authorized representative.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">16. Entire Agreement</h2>
              <p className="mb-3">
                These Terms, together with our Privacy Policy and any other legal notices published by us, constitute the entire 
                agreement between you and BaseBadge regarding your use of our services.
              </p>
              <p>
                These Terms supersede all prior or contemporaneous communications, whether electronic, oral, or written, between 
                you and BaseBadge regarding the subject matter hereof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">17. Contact Information & Support</h2>
              <p className="mb-3">
                For questions about these Terms, technical support, or general inquiries, please contact us through:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Project Builder:</strong> <a href="mailto:0x0mr0m0@gmail.com" className="text-gamefi-yellow hover:underline">0x0mr0m0@gmail.com</a></li>
                <li><strong>GitHub Repository:</strong> <a href="https://github.com/MrM002/BaseBadge" className="text-gamefi-yellow hover:underline">@MrM002/BaseBadge</a></li>
                <li><strong>Farcaster:</strong> <a href="https://farcaster.xyz/basebadge" className="text-gamefi-yellow hover:underline">@basebadge</a></li>
                <li><strong>Response Time:</strong> We aim to respond to all inquiries within 48 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">18. Regulatory Compliance & Updates</h2>
              <p className="mb-3">
                BaseBadge endeavors to align with evolving best practices and community standards:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Industry Standards:</strong> Web3 and blockchain best practices</li>
                <li><strong>Community Governance:</strong> Base Network and Ethereum ecosystem standards</li>
                <li><strong>Privacy Principles:</strong> Alignment with global privacy and data protection principles</li>
                <li><strong>Security Best Practices:</strong> Industry-standard security and privacy measures</li>
                <li><strong>Open Source Collaboration:</strong> Community-driven development and transparency</li>
              </ul>
              <p className="mt-3 text-sm text-gray-400">
                <strong>Important Note:</strong> This project has a non-custodial nature and does not implement KYC/AML processes. 
                Users are responsible for compliance with their local regulations and laws.
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