import systemTests from '../lib/system-tests'

describe('e2e bun package manager', () => {
  systemTests.setup()

  systemTests.it('can install dependencies and run basic tests', {
    snapshot: false,
    browser: 'electron',
    project: 'bun-with-deps',
  })

  systemTests.it('can handle component testing with bun', {
    snapshot: false,
    browser: 'chrome',
    project: 'bun-component-testing',
    testingType: 'component',
  })
})
