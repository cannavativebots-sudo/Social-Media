import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api/* to the Express backend so the browser never needs
  // to know the API origin — no CORS issues in dev or production.
  async rewrites() {
    const apiBase = process.env.API_URL ?? "http://localhost:3001";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
