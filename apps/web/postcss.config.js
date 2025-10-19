// Next.js expects a CommonJS export for postcss.config.js
// Enable TailwindCSS for src/app and autoprefixer.
module.exports = {
  // Disable Tailwind PostCSS plugin to avoid lightningcss native dependency on WSL.
  // We only use handwritten CSS in this app.
  plugins: {
    autoprefixer: {},
  },
};
