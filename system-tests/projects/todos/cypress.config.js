module.exports = {
  'fixturesFolder': 'tests/_fixtures',
  'port': 8888,
  'projectId': 'abc123',
  'component': {
    experimentalSingleTabRunMode: true,
    'specPattern': 'src/**/*.spec.cy.js',
    'supportFile': 'tests/_support/spec_helper.js',
    'devServer': {
      'framework': 'react',
      'bundler': 'webpack',
      'webpackConfig': {},
    },
  },
  'e2e': {
    'supportFile': 'tests/_support/spec_helper.js',
    'specPattern': 'tests/**/*.(js|ts|coffee)',
    'setupNodeEvents': (on, config) => config,
  },
}
