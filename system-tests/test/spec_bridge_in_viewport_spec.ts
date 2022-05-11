import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/secondary_origin.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `secondary_origin.html`))
  })
}

describe('e2e spec bridge in viewport', () => {
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

  systemTests.it('Overlays the reporter/AUT and is not positioned off screen, leading to potential performance impacts with cy.origin', {
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    spec: 'spec_bridge.cy.ts',
    snapshot: true,
    browser: 'electron',
    expectedExitCode: 0,
    config: {
      experimentalSessionAndOrigin: true,
    },
  })
})
