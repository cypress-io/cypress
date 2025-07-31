import systemTests from '../lib/system-tests'

describe('e2e sourcemaps', () => {
  systemTests.setup()

  systemTests.it('detects sourcemaps as enabled', {
    project: 'sourcemaps',
    spec: 'validate-sourcemaps.cy.js',
    configFile: 'cypress-enabled.config.js',
  })

  systemTests.it('detects sourcemaps as disabled', {
    project: 'sourcemaps',
    spec: 'validate-sourcemaps.cy.js',
    configFile: 'cypress-disabled.config.js',
  })
})
