import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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