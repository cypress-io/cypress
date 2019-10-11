import mockedEnv from 'mocked-env'

const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

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

  it('fails when remote debugging port cannot be connected to', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('remote-debugging-port-removed'),
      spec: 'spec.ts',
      browser: 'chrome',
      expectedExitCode: 1,
      snapshot: true,
    })
  })
})
