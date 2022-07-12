module.exports = {
  'fixturesFolder': 'tests/_fixtures',
  'port': 8888,
  'projectId': 'abc123',
  'component': {
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
    'specPattern': 'tests/**/*',
    'setupNodeEvents': (on, config) => config,
  },
}
