const e2e = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')

describe('e2e cdp', function () {
  e2e.setup()

  it('fails when remote debugging port cannot be connected to', function () {
    return e2e.exec(this, {
      project: Fixtures.projectPath('remote-debugging-port-removed'),
      spec: 'spec.ts',
      browser: 'chrome',
      expectedExitCode: 1,
      snapshot: true,
      onStdout: (stdout: string) => {
        return stdout
        .replace(/(port requested was )(\d+)/, '$1777')
        .replace(/(127\.0\.0\.1:)(\d+)/, '$1777')
      },
    })
  })
})
