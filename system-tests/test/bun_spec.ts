import systemTests from '../lib/system-tests'
import { shouldSkipBunSystemTests } from './bun_support'

describe('e2e bun package manager', () => {
  systemTests.setup()
  const skip = shouldSkipBunSystemTests()

  systemTests.it('can install dependencies and run basic tests', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
    skip,
  })

  systemTests.it('can handle component testing with bun', {
    snapshot: false,
    browser: 'chrome',
    project: 'bun-component-testing',
    testingType: 'component',
    skip,
  })
})
