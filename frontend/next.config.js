/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds to avoid failing production Docker builds
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['github.com', 'avatars.githubusercontent.com'],
  },
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  async rewrites() {
    // Get API URL from environment or use default
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    return [
      { source: '/api/bff/:path*', destination: `${apiUrl}/bff/:path*` },
      { source: '/api/auth/:path*', destination: `${apiUrl}/auth/:path*` },
      { source: '/api/profile/:path*', destination: `${apiUrl}/profile/:path*` },
    ];
  },
}

module.exports = nextConfig