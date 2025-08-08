/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: "/sessions", destination: "/" },
      { source: "/upload", destination: "/" },
      { source: "/format", destination: "/" },
      { source: "/quiz", destination: "/" },
      { source: "/slides", destination: "/" },
      { source: "/results", destination: "/" },
    ];
  },
};

export default nextConfig;
