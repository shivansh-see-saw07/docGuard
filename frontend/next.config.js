/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
      ignoreDuringBuilds: true,
    },
    typescript: {
      ignoreBuildErrors: true,
    },
  webpack: (config, { isServer }) => {
    // Handle ethers.js polyfills for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Exclude problematic files from processing
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      use: 'ignore-loader'
    });

    // Handle worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: 'ignore-loader'
    });

    return config;
  },
  // Optimize images
    images: {
    domains: ['localhost'],
    },
    // Environment variables
    env: {
      NEXT_PUBLIC_SUBGRAPH_URL: process.env.NEXT_PUBLIC_SUBGRAPH_URL || 'https://api.studio.thegraph.com/query/111188/doc-guard-sg/version/latest',
      NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
    },
    // Headers for security
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
            },
          ],
        },
      ]
    },
  }
  
  module.exports = nextConfig
  