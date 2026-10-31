import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Exclude heavy dev-only packages from the serverless function bundle
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/**',
      'node_modules/webpack/**',
      'node_modules/terser/**',
      'node_modules/typescript/**',
      'node_modules/eslint/**',
      '.git/**',
    ],
  },
};

export default nextConfig;
