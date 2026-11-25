import systemTests from '../lib/system-tests'

const APP_SERVER_PORT = 3478

describe('e2e privileged commands with a fixed port', () => {
  systemTests.setup({
    servers: {
      port: APP_SERVER_PORT,
      onServer (app) {
        app.get('/', (req, res) => res.send('<html><body>Ahab</body></html>'))
      },
    },
  })

  systemTests.it('runs privileged commands when setupNodeEvents sets a baseUrl and a suite clears it', {
    project: 'privileged-commands-fixed-port',
    spec: 'spec.cy.ts',
    port: 3479,
    expectedExitCode: 0,
    snapshot: false,
    processEnv: { APP_SERVER_PORT },
  })
})
