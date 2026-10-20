import path from 'path'
import systemTests from '../lib/system-tests'
import { generateMtlsCertificates, startMtlsServer } from '../lib/mtls-server'

const PROJECT = 'mtls-client-certificate'
const PORT = 15443
// A second origin, so a spec can be pointed at one the run has not connected to yet.
const PORT_2 = 15444
const CERTS_DIR = path.join(__dirname, '..', 'projects', PROJECT, 'certs')
const processEnv = { MTLS_PORT: String(PORT), MTLS_PORT_2: String(PORT_2) }

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

  const withServers = (exec: () => Promise<any>) => {
    generateMtlsCertificates(CERTS_DIR)

    return Promise.all([startMtlsServer(CERTS_DIR, PORT), startMtlsServer(CERTS_DIR, PORT_2)]).then((servers) => {
      return exec().finally(() => {
        return Promise.all(servers.map((server) => new Promise((resolve) => server.close(() => resolve(null)))))
      })
    })
  }

  // Chrome is the browser that regressed; Electron and Firefox stay on the MITM proxy and
  // must keep working regardless.
  systemTests.it('presents client certificates', {
    project: PROJECT,
    spec: 'client-certificate.cy.ts',
    browser: ['chrome', 'electron', 'firefox'],
    expectedExitCode: 0,
    processEnv,
    onRun: withServers,
  })

  systemTests.it('presents client certificates with forceHttp1', {
    project: PROJECT,
    spec: 'client-certificate.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
    config: { forceHttp1: true },
    processEnv,
    onRun: withServers,
  })

  // The bridge binds local ports and the browser is told about them once, in its launch
  // arguments. Chrome is reused from one spec to the next, so a bridge that did not outlive
  // a single launch would leave this second spec steered at a closed port.
  systemTests.it('keeps presenting client certificates on a later spec', {
    project: PROJECT,
    spec: 'client-certificate.cy.ts,second-origin.cy.ts',
    browser: 'chrome',
    expectedExitCode: 0,
    processEnv,
    onRun: withServers,
  })
})
