import type { NextConfig } from "next";

// Static export: the built homepage is copied into the static site root (see scripts/export-site.mjs).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  turbopack: { root: __dirname },
};

export default nextConfig;
