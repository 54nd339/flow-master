import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Mark server-only packages for Turbopack
  // This ensures fs and path are only used server-side
  serverExternalPackages: ['fs', 'path'],
};

export default nextConfig;
