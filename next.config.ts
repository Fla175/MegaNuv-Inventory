import type { NextConfig } from "next";

/**
 * Host público do MinIO, derivado do ambiente.
 *
 * Não há host de produção em código: `next/image` só aceita imagens do host
 * que já estiver configurado. Se a variável estiver ausente em tempo de build,
 * a lista é vazia — o app falha fechado em vez de expor um host fixo.
 */
const minioPublicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT;
const minioPublicProtocol = process.env.MINIO_PUBLIC_USE_SSL === "true" ? "https" : "http";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = minioPublicEndpoint
  ? [
      {
        protocol: minioPublicProtocol,
        hostname: minioPublicEndpoint,
        pathname: "/**",
      },
    ]
  : [];

const nextConfig: NextConfig = {
  output: "standalone",
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
    remotePatterns,
  },
};

export default nextConfig;
