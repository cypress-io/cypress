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

  // NOTE: this test takes almost a minute and is largely redundant with protocol_spec
  systemTests.it.skip('fails when remote debugging port cannot be connected to', {
    project: 'remote-debugging-port-removed',
    spec: 'spec.cy.ts',
    browser: 'chrome',
    expectedExitCode: 1,
  })

  // https://github.com/cypress-io/cypress/issues/5685
  systemTests.it('handles disconnections as expected', {
    project: 'remote-debugging-disconnect',
    spec: 'spec.cy.ts',
    browser: 'chrome',
    expectedExitCode: 1,
    snapshot: true,
    onStdout: (stdout) => {
      // the location of this warning is non-deterministic
      return stdout.replace('The automation client disconnected. Cannot continue running tests.\n', '')
    },
  })
})
