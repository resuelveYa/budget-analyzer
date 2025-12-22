import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build for deployment
  output: 'standalone',

  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_API_URL || 'https://api.resuelveya.cl/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;