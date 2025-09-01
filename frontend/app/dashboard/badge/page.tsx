'use client'

import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

// Dynamic imports for client-side only components
const Dither = dynamic(() => import('../../../components/Dither'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
})

const ASCIIText = dynamic(() => import('../../../components/ASCIIText'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gradient-to-br from-slate-700/30 via-slate-600/20 to-slate-700/30 rounded-xl" />
})

export default function BadgePage() {
  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Animated Background with Dither Effect */}
      <div className="fixed inset-0 -z-20">
        <Dither
          waveColor={[0.1, 0.05, 0.2]}
          waveSpeed={0.03}
          waveFrequency={2.5}
          waveAmplitude={0.4}
          enableMouseInteraction={true}
          mouseRadius={0.8}
        />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
            className="mb-8"
          >
            {/* Main ASCII "ComingSoon" Text - Much Larger and Visible */}
            <div className="h-64 relative mb-8">
              <ASCIIText
                text="ComingSoon"
                asciiFontSize={14}
                textFontSize={169}
                textColor="#fdf9f3"
                planeBaseHeight={14}
                enableWaves={true}
              />
            </div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
              className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              We're working hard to bring you an amazing badge system that will gamify your wallet reputation experience!
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
            className="mb-12"
          >
            <div className="bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-sm border border-gray-800/60 rounded-3xl p-10 max-w-3xl mx-auto shadow-2xl">
              <div className="text-5xl mb-6 text-center">🚀</div>
              <h2 className="text-3xl font-bold text-white mb-8 text-center">What's Coming?</h2>
              <div className="space-y-6 text-left">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-300">
                  <span className="text-gamefi-yellow text-2xl">✨</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Achievement Badges</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Earn badges for completing transactions, maintaining security, and contributing to the Base ecosystem</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-300">
                  <span className="text-gamefi-yellow text-2xl">🎮</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Gamified Experience</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Level up your reputation through interactive challenges and community participation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-300">
                  <span className="text-gamefi-yellow text-2xl">🏅</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Rare Collectibles</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Collect unique badges that showcase your expertise and achievements</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 transition-colors duration-300">
                  <span className="text-gamefi-yellow text-2xl">🤝</span>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-2">Community Recognition</h3>
                    <p className="text-gray-300 text-base leading-relaxed">Share your achievements and build trust within the Base community</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.9, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-blue-900/40 via-purple-900/50 to-indigo-900/40 backdrop-blur-md rounded-2xl border border-blue-400/30 p-8 max-w-2xl mx-auto shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 group">
              <div className="text-center">
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">🌟</div>
                <p className="text-gray-100 text-center text-lg font-medium leading-relaxed">
                  Stay tuned for updates! Follow us on social media to be the first to know when badges launch.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}