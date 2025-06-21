import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    CUSTOM_PORT: process.env.PORT || '5001',
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:5001'],
    },
  },
};

export default nextConfig;
