import mockedEnv from 'mocked-env'
import e2e from '../support/helpers/e2e'
import Fixtures from '../support/helpers/fixtures'

describe('e2e cdp', function () {
  e2e.setup()
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
  e2e.it.skip('fails when remote debugging port cannot be connected to', {
    project: Fixtures.projectPath('remote-debugging-port-removed'),
    spec: 'spec.ts',
    browser: 'chrome',
    expectedExitCode: 1,
  })

  // https://github.com/cypress-io/cypress/issues/5685
  e2e.it('handles disconnections as expected', {
    project: Fixtures.projectPath('remote-debugging-disconnect'),
    spec: 'spec.ts',
    browser: 'chrome',
    expectedExitCode: 1,
    snapshot: true,
    onStdout: (stdout) => {
      // the location of this warning is non-deterministic
      return stdout.replace('The automation client disconnected. Cannot continue running tests.\n', '')
    },
  })
})
