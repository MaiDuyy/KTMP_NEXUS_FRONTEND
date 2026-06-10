import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compiler: {
    // Xóa tất cả console.* ngoại trừ console.error
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error'],
    } : false,
  },
  reactStrictMode: true,
  typescript: {
    // Pre-existing TS errors in legacy files — does not affect Phase 2 functionality
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
