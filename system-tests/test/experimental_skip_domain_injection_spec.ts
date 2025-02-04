import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const PORT = 3500
const onServer = function (app) {
  app.get('/primary_origin.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `primary_origin.html`))
  })

  app.get('/secondary_origin.html', (_, res) => {
    res.sendFile(path.join(e2ePath, `secondary_origin.html`))
  })
}

describe('e2e experimentalSkipDomainInjection=true', () => {
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

  systemTests.it('fails with an error message about experimentalSkipDomainInjection being removed', {
    browser: '!webkit', // TODO(webkit): fix+unskip (needs multidomain support)
    // keep the port the same to prevent issues with the snapshot
    port: PORT,
    snapshot: true,
    expectedExitCode: 1,
    config: {
      retries: 0,
      experimentalSkipDomainInjection: ['*.foobar.com'],
    },
  })
})
