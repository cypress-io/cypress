import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

// #34652: on the browser network (CDP Fetch) path, a service worker's
// navigation preload request bypasses Fetch.requestPaused (verified
// empirically), so the renderer keeps raw framebusting headers and the AUT
// iframe refuses to load. disable-navigation-preload.ts disables preload in
// both the worker and window realms so the SW's fetch handler falls back to
// fetch(e.request), which CDP Fetch does intercept. This spec asserts that
// mechanism directly rather than a full navigation-level repro — #34674
// disclaims that repro pending a CI-only worker cold-start timing gap.
const onSwServer = function (app) {
  app.get('/', (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'')
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(path.join(e2ePath, 'static', 'framebusting', 'index.html'))
  })

  // Cacheable on purpose: a culled worker's cold-start update check refetches
  // its script, and that fetch can escape interception (#34674). With
  // no-store, the escaped refetch returns the raw, uninjected script, Chrome
  // sees different bytes than the installed (injected) version, installs it
  // as a new worker version, and that version's activate runs a real
  // enable() - flipping the very flag this spec asserts on. A cached script
  // makes every update check reuse the injected bytes, so no unpatched
  // version can ever install.
  app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'max-age=3600')
    res.type('application/javascript').sendFile(path.join(e2ePath, 'static', 'framebusting', 'sw.js'))
  })

  // Readiness probe (see static/framebusting/index.html): served with a
  // framebusting header that interception strips once traffic is intercepted.
  app.get('/probe', (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Cache-Control', 'no-store')
    res.send('probe')
  })
}

describe('e2e browser network framebusting', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer: onSwServer,
    }],
  })

  // The opt-in full-suite forceHttp1 CI jobs export CYPRESS_forceHttp1=true
  // (see .circleci @pipeline.yml); CLI config always beats env, so the
  // explicit `forceHttp1: false` below is what pins this variant to the
  // browser network path there.
  systemTests.it('disables navigation preload behind a nav-preload service worker [browser network]', {
    browser: 'chrome',
    spec: 'proxy_disabled_framebusting.cy.js',
    expectedExitCode: 0,
    config: {
      forceHttp1: false,
      pageLoadTimeout: 15000,
      env: {
        expectedNavigationPreloadEnabled: false,
        expectedRunnerNamespacePoisoned: false,
      },
    },
  })

  // forceHttp1: true selects the MITM path — the control proving real
  // navigation preload still works there.
  systemTests.it('leaves navigation preload enabled behind a nav-preload service worker [forceHttp1]', {
    browser: 'chrome',
    spec: 'proxy_disabled_framebusting.cy.js',
    expectedExitCode: 0,
    config: {
      forceHttp1: true,
      pageLoadTimeout: 15000,
      env: {
        expectedNavigationPreloadEnabled: true,
        expectedRunnerNamespacePoisoned: true,
      },
    },
  })
})
