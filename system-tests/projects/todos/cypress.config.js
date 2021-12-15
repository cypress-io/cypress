module.exports = {
  'integrationFolder': 'tests',
  'fixturesFolder': 'tests/_fixtures',
  'port': 8888,
  'projectId': 'abc123',
  'pluginsFile': false,
  'component': {
    'specFilePattern': 'src/**/*.spec.cy.js',
    'supportFile': 'tests/_support/spec_helper.js',
  },
  'e2e': {
    'supportFile': 'tests/_support/spec_helper.js',
  },
}
