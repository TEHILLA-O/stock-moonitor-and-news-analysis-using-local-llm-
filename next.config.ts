import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["yahoo-finance2"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
