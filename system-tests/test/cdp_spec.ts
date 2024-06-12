import mockedEnv from 'mocked-env'
import systemTests from '../lib/system-tests'

describe('e2e cdp', function () {
  systemTests.setup()
  let restoreEnv: Function

  beforeEach(() => {
    restoreEnv = mockedEnv({
      CYPRESS_REMOTE_DEBUGGING_PORT: '7777',
    })
  })

  afterEach(() => {
    restoreEnv()
  })

  // https://github.com/cypress-io/cypress/issues/5685
  systemTests.it('handles disconnections as expected', {
    project: 'remote-debugging-disconnect',
    spec: 'spec.cy.ts',
    browser: 'chrome',
    skip: true, // TODO: Investigate and unskip flaky test
  })
})
