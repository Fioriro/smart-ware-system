import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  
  // Enable strict mode for better error detection
  reactStrictMode: true,
  
  // Output configuration for production builds
  output: process.env.NEXT_OUTPUT_MODE === 'standalone' ? 'standalone' : undefined,
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'SmartStock',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // Image optimization settings
  images: {
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Compiler options for production
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
