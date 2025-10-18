module.exports = {
  spec: ['tests/**/*.test.ts'],
  extension: ['ts'],
  require: ['ts-node/register'],
  timeout: 15000,
  color: true,
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    // external config to keep it tidy
    configFile: 'mocha-multi-reporters.config.js',
  },
};
