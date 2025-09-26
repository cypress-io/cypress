import systemTests from '../lib/system-tests'

describe('bun TypeScript support', () => {
  systemTests.setup()

  systemTests.it('can run TypeScript specs with bun', {
    snapshot: false,
    browser: 'chrome',
    project: 'bun-component-testing',
    testingType: 'component',
    spec: '**/*.cy.ts',
  })

  systemTests.it('can handle TypeScript config files with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-component-testing',
    configFile: 'cypress.config.ts',
  })
})
