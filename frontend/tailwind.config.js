/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@coinbase/onchainkit/**/*.js', // Add this
  ],
  // rest of config...
  theme: {
    extend: {
      colors: {
        // Base Network Colors
        'base-blue': '#0052FF',
        'base-purple': '#6B46C1',
        'base-green': '#10B981',
        'base-orange': '#F59E0B',
        'base-red': '#EF4444',
        'base-gray': {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        // Custom BaseBadge colors - GameFi Theme (Refined)
        'badge-primary': '#0052FF', // Blue
        'badge-secondary': '#6B46C1', // Purple
        'badge-accent': '#FFD700', // Yellow for GameFi theme
        'badge-success': '#10B981',
        'badge-warning': '#F59E0B',
        'badge-danger': '#EF4444',
        // GameFi specific colors - More sophisticated
        'gamefi-black': '#000000',
        'gamefi-blue': '#0052FF',
        'gamefi-blue-dark': '#0040CC',
        'gamefi-blue-light': '#4D94FF',
        'gamefi-yellow': '#FFB800', // Softer yellow
        'gamefi-yellow-light': '#FFD54F', // Even softer for hover
        'gamefi-yellow-glow': '#FFA000', // For glow effects
        'gamefi-dark': '#0A0A0A',
        'gamefi-dark-blue': '#001122',
        'gamefi-accent': '#FF6B35', // Orange accent
        'gamefi-purple': '#6B46C1',
        'gamefi-green': '#10B981',
        'gamefi-red': '#EF4444',
        'gamefi-orange': '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'glow-soft': 'glowSoft 3s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 184, 0, 0.3), 0 0 10px rgba(255, 184, 0, 0.2)' },
          '100%': { boxShadow: '0 0 10px rgba(255, 184, 0, 0.5), 0 0 20px rgba(255, 184, 0, 0.3)' },
        },
        glowSoft: {
          '0%': { boxShadow: '0 0 3px rgba(255, 184, 0, 0.2)' },
          '100%': { boxShadow: '0 0 8px rgba(255, 184, 0, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
} 