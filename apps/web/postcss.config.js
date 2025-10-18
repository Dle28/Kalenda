// Next.js expects a CommonJS export for postcss.config.js
// Enable TailwindCSS for src/app and autoprefixer.
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
