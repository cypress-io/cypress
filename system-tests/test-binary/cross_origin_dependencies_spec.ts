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

describe('e2e cy.origin dependencies', () => {
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

  // this needs to be a binary test or else it will pick up our own typescript
  // dev dependency and not reproduce the issue
  // https://github.com/cypress-io/cypress/issues/25885
  systemTests.it('handles typescript files', {
    port: PORT,
    project: 'origin-dependencies',
    spec: 'spec.cy.ts',
    config: {
      e2e: {
        experimentalOriginDependencies: true,
      },
    },
    dockerImage: 'cypress/base:12',
    withBinary: true,
    browser: 'electron',
  })
})
