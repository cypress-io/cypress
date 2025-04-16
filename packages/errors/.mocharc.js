module.exports = {
  spec: 'test/unit/*.ts',
  require: '@packages/ts/register',
  recursive: true,
  extension: ['ts'],
  reporter: 'mocha-multi-reporters',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json'
  },
  exit: true
} 