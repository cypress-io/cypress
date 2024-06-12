import path from 'path'
import systemTests, { expect } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/secondary_origin.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `secondary_origin.html`))
  })
}

describe('e2e cy.origin retries', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
    settings: {
      hosts: {
        '*.foobar.com': '127.0.0.1',
      },
      e2e: {},
    },
  })

  systemTests.it('Appropriately displays test retry errors without other side effects', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'cy_origin_retries.cy.ts',
    snapshot: true,
    expectedExitCode: 1,
    config: {
      retries: 2,
    },
    async onRun (exec) {
      const res = await exec()

      // verify that retrying tests with cy.origin doesn't cause serialization problems to spec bridges on test:before:run:async
      expect(res.stdout).not.to.contain('TypeError')
      expect(res.stdout).not.to.contain('Cannot set property message')
      expect(res.stdout).not.to.contain('which has only a getter')

      expect(res.stdout).to.contain('AssertionError')
      expect(res.stdout).to.contain('expected true to be false')
    },
  })

  systemTests.it('passes runnable state to the secondary origin', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    port: PORT,
    spec: 'cy_origin_retries_runnable.cy.ts',
  })
})
