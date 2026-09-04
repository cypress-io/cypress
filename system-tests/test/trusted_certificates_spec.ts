import systemTests from '../lib/system-tests'

// The `trusted-certificates` project points `trustedCertificates` at the exact
// leaf certificate this self-signed HTTPS origin presents. This exercises the
// end-to-end plumbing on the browser (CDP) network path (Chrome/Chromium/Edge):
// the config is validated, each entry's SPKI fingerprint is computed, and the
// `--ignore-certificate-errors-spki-list` flag reaches Chrome alongside the
// blanket `--ignore-certificate-errors`, so the origin is genuinely trusted.
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
  systemTests.setup({
    servers: {
      port: PORT,
      https: true,
      onServer,
    },
  })

  systemTests.it('loads a self-signed origin whose certificate is declared trusted', {
    spec: 'trusted_certificates.cy.ts',
    browser: 'chrome',
    project: 'trusted-certificates',
    expectedExitCode: 0,
  })
})
