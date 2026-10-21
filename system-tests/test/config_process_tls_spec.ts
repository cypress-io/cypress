import systemTests from '../lib/system-tests'

const PORT = 3458

describe('e2e config process TLS verification', () => {
  systemTests.setup({
    servers: {
      port: PORT,
      https: true,
      onServer (app) {
        app.get('/', (req, res) => res.send('ok'))
      },
    },
  })

  systemTests.it('verifies certificates in the config process by default', {
    project: 'config-process-tls',
    spec: 'config_process_tls.cy.ts',
    browser: 'electron',
    expectedExitCode: 0,
    snapshot: false,
    // the test process sets it to '0', so unset it to match a user who never set it
    processEnv: { TLS_SERVER_PORT: PORT, NODE_TLS_REJECT_UNAUTHORIZED: undefined },
    config: {
      expose: { verifiesCertificates: true },
    },
  })

  systemTests.it('keeps certificate verification on when the user enables it', {
    project: 'config-process-tls',
    spec: 'config_process_tls.cy.ts',
    browser: 'electron',
    expectedExitCode: 0,
    snapshot: false,
    processEnv: { TLS_SERVER_PORT: PORT, NODE_TLS_REJECT_UNAUTHORIZED: '1' },
    config: {
      expose: { verifiesCertificates: true, nodeTlsRejectUnauthorized: '1' },
    },
  })

  systemTests.it('disables certificate verification when the user disables it', {
    project: 'config-process-tls',
    spec: 'config_process_tls.cy.ts',
    browser: 'electron',
    expectedExitCode: 0,
    snapshot: false,
    processEnv: { TLS_SERVER_PORT: PORT, NODE_TLS_REJECT_UNAUTHORIZED: '0' },
    config: {
      expose: { verifiesCertificates: false, nodeTlsRejectUnauthorized: '0' },
    },
  })
})
