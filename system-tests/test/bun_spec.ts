import systemTests from '../lib/system-tests'
import { bunFixtureHttpServer, shouldSkipBunSystemTests } from './bun_support'

describe('e2e bun package manager', () => {
  systemTests.setup({
    servers: bunFixtureHttpServer('bun-with-deps'),
  })

  const skip = shouldSkipBunSystemTests()

  systemTests.it('can install dependencies and run basic tests', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    skip,
  })

  systemTests.it('can handle component testing with bun', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-component-testing',
    testingType: 'component',
    skip,
  })
})
