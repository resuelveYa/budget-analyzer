import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // basePath: '/budget', // 👈 Eliminado: ahora está en la raíz del subdominio budget.resuelveya.cl
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: `${process.env.BACKEND_API_URL || 'http://localhost:3001'}/api/:path*`,
      },
    ];
  },
  experimental: {
    // Aumentar límite para buffering de proxy (SSE/PDFs grandes)
    // Next.js 16 usa proxyClientMaxBodySize. middlewareClientMaxBodySize está deprecado.
    proxyClientMaxBodySize: '50mb',
  }
};

export default nextConfig;