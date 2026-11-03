import systemTests from '../lib/system-tests'

// #34794: a spec whose served bundle is very large must still load after the
// runner reloads on another origin (cy.visit to a different origin), on the
// browser network path as well as the legacy forceHttp1 path.
const onServer = function (app) {
  app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.type('html').send('<html><body><h1>large spec bundle ok</h1></body></html>')
  })
}

describe('e2e large spec bundle', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer,
    }],
  })

  // The opt-in full-suite forceHttp1 CI jobs export CYPRESS_forceHttp1=true;
  // CLI config always beats env, so the explicit `forceHttp1: false` below
  // pins this variant to the browser network path there.
  systemTests.it('loads a large spec bundle after a cross-origin visit [browser network]', {
    browser: 'chrome',
    project: 'large-spec-bundle',
    spec: 'large_spec_bundle.cy.ts',
    expectedExitCode: 0,
    timeout: 90000,
    config: {
      forceHttp1: false,
    },
  })

  // forceHttp1: true selects the MITM path, the control for the same spec.
  systemTests.it('loads a large spec bundle after a cross-origin visit [forceHttp1]', {
    browser: 'chrome',
    project: 'large-spec-bundle',
    spec: 'large_spec_bundle.cy.ts',
    expectedExitCode: 0,
    timeout: 90000,
    config: {
      forceHttp1: true,
    },
  })
})
