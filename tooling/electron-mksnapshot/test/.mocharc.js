module.exports = {
  require: '@packages/ts/register',
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  timeout: 90000,
  watchFiles: ['test/**/*.ts', 'src/**/*.ts'],
}
