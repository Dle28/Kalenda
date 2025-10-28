// Ensure Tailwind v4 doesn't require native lightningcss when building in WSL/CI
process.env.TAILWIND_DISABLE_LIGHTNINGCSS = process.env.TAILWIND_DISABLE_LIGHTNINGCSS || '1';
process.env.LIGHTNINGCSS_FORCE_WASM = process.env.LIGHTNINGCSS_FORCE_WASM || '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Disable Lightning CSS optimization to avoid native binary requirement on WSL
    optimizeCss: false,
  },
  webpack: (config, { dev }) => {
    // Silence occasional webpack pack cache warnings on Windows by avoiding persistent disk cache in dev
    if (dev) {
      config.cache = { type: 'memory' };
    }
    // Ignore optional pretty printer pulled by pino in some transitive deps
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['pino-pretty'] = false;
    return config;
  },
};

module.exports = nextConfig;

