import path from 'path'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/multi_domain_secondary.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `multi_domain_secondary.html`))
  })
}

describe('e2e multi domain retries', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
    },
  })

  systemTests.it('Appropriately displays test retry errors without other side effects', {
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'multi_domain_retries_spec.ts',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      experimentalMultiDomain: true,
      experimentalSessionSupport: true,
      retries: 2,
    },
    async onRun (exec) {
      const res = await exec()

      // verify that retrying tests with multi domain doesn't cause serialization problems to spec bridges on test:before:run:async
      expect(res.stdout).to.not.contain('TypeError')
      expect(res.stdout).to.not.contain('Cannot set property message of  which has only a getter')

      expect(res.stdout).to.contain('AssertionError')
      expect(res.stdout).to.contain('expected true to be false')
    },
  })
})
