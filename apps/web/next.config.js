/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Ignore optional pretty printer pulled by pino in some transitive deps
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['pino-pretty'] = false;
    return config;
  },
};

module.exports = nextConfig;
