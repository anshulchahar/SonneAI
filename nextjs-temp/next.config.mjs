// next.config.mjs
import deploymentConfig from './deployment.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        domains: ['lh3.googleusercontent.com'], // For Google auth profile images
    },
    // Explicitly expose environment variables
    env: {
        GEMINI_API_KEY: process.env.GEMINI_API_KEY,
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
                .map(([key, values]) => `${key} ${values.join(' ')}`)
                .join('; ');

            headers[0].headers.push({
                key: 'Content-Security-Policy',
                value: `${cspValue}; connect-src 'self' https://api.emailjs.com`,
            });
        } else {
            headers[0].headers.push({
                key: 'Content-Security-Policy',
                value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://lh3.googleusercontent.com https://authjs.dev; font-src 'self'; object-src 'none'; connect-src 'self' https://api.emailjs.com",
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
