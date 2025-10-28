import systemTests from '../lib/system-tests'

describe('e2e sourcemaps', () => {
  systemTests.setup()

  systemTests.it('detects sourcemaps as enabled', {
    browser: '!webkit',
    project: 'sourcemaps',
    spec: 'validate-sourcemaps.cy.js',
    configFile: 'cypress-enabled.config.mjs',
  })

  systemTests.it('detects sourcemaps as disabled', {
    browser: '!webkit',
    project: 'sourcemaps',
    spec: 'validate-sourcemaps.cy.js',
    configFile: 'cypress-disabled.config.mjs',
  })

  systemTests.it('detects sourcemaps as enabled with updated sourcemap root', {
    browser: '!webkit',
    project: 'sourcemaps',
    spec: 'validate-sourcemaps.cy.js',
    configFile: 'cypress-enabled-updated-sourcemap-root.config.mjs',
  })
})
