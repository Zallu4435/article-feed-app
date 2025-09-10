import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  swcMinify: false,
  serverExternalPackages: ["typeorm", "pg"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Preserve class/function names so TypeORM can resolve entity metadata
      config.optimization = {
        ...(config.optimization || {}),
        minimize: false,
      };
    }
    config.externals = [...(config.externals || []), "pg-native"];
    return config;
  },
  env: {
    CUSTOM_KEY: "my-value",
  },
  images: {
    domains: ["res.cloudinary.com", "images.unsplash.com"],
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
