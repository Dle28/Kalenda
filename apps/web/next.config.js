/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  webpack: (config) => {
    config.resolve.alias['pino-pretty'] = false;
    return config;
  },
};

export default nextConfig;
