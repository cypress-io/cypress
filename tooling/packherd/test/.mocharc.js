module.exports = {
  require: '@packages/ts/register',
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  timeout: 30000,
  spec: 'test/**/*.spec.ts',
  watchFiles: ['test/**/*.ts', 'src/**/*.ts'],
}
