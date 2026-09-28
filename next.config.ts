import type { NextConfig } from "next";

const config: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ["@firecrawl/anydoc"],
  images: { qualities: [60, 75] },
  // Cross-origin isolation lets the embedding runtime use threads.
  headers: async () => [{
    source: "/:path*",
    headers: [
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
    ],
  }],
};

export default config;
