import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
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
        hostname: 'minio.meganuv.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
