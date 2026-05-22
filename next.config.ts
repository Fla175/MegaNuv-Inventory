import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.20.31.142' || 'inventory.meganuv.com',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
