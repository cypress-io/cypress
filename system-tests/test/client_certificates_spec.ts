import path from 'path'
import systemTests from '../lib/system-tests'
import { generateMtlsCertificates, startMtlsServer } from '../lib/mtls-server'

const PROJECT = 'mtls-client-certificate'
const PORT = 15443
const CERTS_DIR = path.join(__dirname, '..', 'projects', PROJECT, 'certs')

/**
 * https://github.com/cypress-io/cypress/issues/34807
 *
 * `clientCertificates` is only honored by the Node-side agent. On the browser (CDP)
 * network path Chromium makes origin requests itself and presents no certificate, so
 * subresources fail while `cy.request` and the visited document still pass. These run on
 * Chrome both with and without `forceHttp1` — the `forceHttp1` case guards the MITM path
 * that already worked.
 */
describe('e2e client certificates', () => {
  systemTests.setup()

  const withServer = (exec: () => Promise<any>) => {
    generateMtlsCertificates(CERTS_DIR)

    return startMtlsServer(CERTS_DIR, PORT).then((server) => {
      return exec().finally(() => new Promise((resolve) => server.close(() => resolve(null))))
    })
  }

  // Chrome is the browser that regressed; Electron and Firefox stay on the MITM proxy and
  // must keep working regardless.
  systemTests.it('presents client certificates', {
    project: PROJECT,
    spec: 'client-certificate.cy.ts',
    browser: ['chrome', 'electron', 'firefox'],
    expectedExitCode: 0,
    processEnv: { MTLS_PORT: String(PORT) },
    onRun: withServer,
  })

  systemTests.it('presents client certificates with forceHttp1', {
    project: PROJECT,
    spec: 'client-certificate.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
    config: { forceHttp1: true },
    processEnv: { MTLS_PORT: String(PORT) },
    onRun: withServer,
  })
})
