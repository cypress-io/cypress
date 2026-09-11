import path from 'path'
import fs from 'fs-extra'

import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

// The `trusted-certificates` project points `trustedCertificates` at the exact
// leaf certificate this self-signed HTTPS origin presents. This exercises the
// end-to-end plumbing on the browser (CDP) network path (Chrome/Chromium/Edge):
// the config is validated, each entry's SPKI fingerprint is computed, and the
// `--ignore-certificate-errors-spki-list` flag reaches Chrome alongside the
// blanket `--ignore-certificate-errors`, so the origin is genuinely trusted.
// The flag assertion lives in the fixture's `before:browser:launch` handler,
// since the blanket flag alone would make the spec pass with no trusted certs.
//
// NOTE: this does NOT assert the disk-cache behavior the feature restores. That
// is unobservable from a Cypress system test — Cypress's `--test-type` /
// `--reduce-security-for-testing` flags load invalid certs regardless of trust,
// the same-renderer memory cache masks the disk cache within a spec, and Cypress
// resets the browser cache between specs. The cache behavior is covered by the
// lower-level verification harness instead.
//
// `browser: 'chrome'` makes `systemTests.it` skip on the Firefox/WebKit/Electron
// CI jobs (its `specifiedBrowser` gate), since the netstack is Chromium-only.

const PORT = 3232

const onServer = function (app) {
  app.get('/big.js', (req, res) => {
    res
    .set('cache-control', 'public, max-age=3600')
    .set('etag', '"big-v1"')
    .type('application/javascript')
    .send('window.__big = true')
  })

  app.get('/', (req, res) => {
    res
    .set('cache-control', 'no-store')
    .type('html')
    .send('<html><head></head><body><h1>trusted</h1><script src="/big.js"></script></body></html>')
  })
}

describe('e2e trusted certificates', () => {
  // The fixture cert must stay a byte copy of the cert the system-test HTTPS
  // server presents. If the https-proxy cert is regenerated, the fixture's
  // hardcoded SPKI keeps satisfying its own launch hook, so this is the only
  // thing that catches the drift.
  before(async () => {
    const fixtureCert = await fs.readFile(path.join(Fixtures.projects, 'trusted-certificates', 'certs', 'server.crt.pem'), 'utf8')
    const servedCert = await fs.readFile(path.join(__dirname, '..', '..', 'packages', 'https-proxy', 'test', 'helpers', 'certs', 'server', 'my-server.crt.pem'), 'utf8')

    expect(fixtureCert).to.eq(servedCert, 'trusted-certificates fixture cert has drifted from the https-proxy server cert')
  })

  systemTests.setup({
    servers: {
      port: PORT,
      https: true,
      onServer,
    },
  })

  // The opt-in full-suite forceHttp1 CI jobs export CYPRESS_forceHttp1=true
  // (see .circleci @pipeline.yml). The fixture's before:browser:launch check
  // only holds on the browser network path, and CLI config beats env, so the
  // explicit `forceHttp1: false` pins this test to that path there.
  systemTests.it('loads a self-signed origin whose certificate is declared trusted', {
    spec: 'trusted_certificates.cy.ts',
    browser: 'chrome',
    project: 'trusted-certificates',
    expectedExitCode: 0,
    config: {
      forceHttp1: false,
    },
  })
})
