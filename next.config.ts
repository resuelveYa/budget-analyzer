import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // basePath: '/budget', // 👈 Eliminado: ahora está en la raíz del subdominio budget.resuelveya.cl
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_API_URL || 'https://resuelveya.cl/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;