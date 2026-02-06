import type { NextConfig } from 'next';
import deploymentConfig from './deployment.config.mjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
  async headers() {
    const headers = [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];

    // Add Content-Security-Policy header if enabled in deployment config
    if (deploymentConfig.csp && deploymentConfig.csp.enabled) {
      const cspValue = Object.entries(deploymentConfig.csp.directives)
        .map(([key, values]) => `${key} ${(values as string[]).join(' ')}`)
        .join('; ');

      headers[0].headers.push({
        key: 'Content-Security-Policy',
        value: cspValue,
      });
    }

    return headers;
  },
  // Add custom webpack configuration for PDF processing
  webpack: (config) => {
    // Support for large PDF files
    config.performance = {
      ...config.performance,
      maxAssetSize: 1024 * 1024, // 1 MB
      maxEntrypointSize: 1024 * 1024, // 1 MB
    };

    return config;
  },
};

export default nextConfig;
