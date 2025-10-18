module.exports = {
  reporterEnabled: 'spec, mochawesome, mocha-junit-reporter',
  mochawesomeReporterOptions: {
    reportDir: 'reports/mochawesome',
    reportFilename: 'index',
    reportTitle: 'MICA-E.Dapp Test Report',
    reportPageTitle: 'MICA-E.Dapp Test Report',
    inline: true,
    charts: true,
    code: false,
    overwrite: true,
    quiet: true,
  },
  mochaJunitReporterReporterOptions: {
    mochaFile: 'reports/junit/test-results.[hash].xml',
    toConsole: false,
  },
};
