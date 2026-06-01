import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.20.31.142',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'inventory.meganuv.com',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
