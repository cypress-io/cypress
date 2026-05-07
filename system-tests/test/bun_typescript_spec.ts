import systemTests from '../lib/system-tests'
import { shouldSkipBunSystemTests } from './bun_support'

describe('bun TypeScript support', () => {
  systemTests.setup()
  const skip = shouldSkipBunSystemTests()

  systemTests.it('can run TypeScript specs with bun', {
    snapshot: false,
    browser: 'chrome',
    project: 'bun-component-testing',
    testingType: 'component',
    spec: '**/*.cy.{ts,tsx}',
    skip,
  })

  systemTests.it('can handle TypeScript config files with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-component-testing',
    configFile: 'cypress.config.ts',
    skip,
  })
})
