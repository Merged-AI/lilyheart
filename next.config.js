/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://lilyheart.ai/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
