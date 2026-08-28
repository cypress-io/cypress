import path from 'path'
import systemTests from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

// Reuses the #34652 framebusting fixture, served on one port that the spec
// reaches under two hosts: localhost (same site as the runner's top) and
// 127.0.0.1 (a different site, so Chromium hosts the AUT out of process).
const onSwServer = function (app) {
  // Landing page for the first visit of the out-of-process case. Its only job
  // is to pin top to localhost before the AUT moves to 127.0.0.1.
  app.get('/blank', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.type('html').send('<html><body><h1 id="app">blank</h1></body></html>')
  })

  app.get('/', (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'')
    res.setHeader('Cache-Control', 'no-store')
    res.sendFile(path.join(e2ePath, 'static', 'framebusting', 'index.html'))
  })

  // Cacheable for the reason proxy_disabled_framebusting_spec.ts gives: an
  // escaped update-check refetch would install an uninjected worker version
  // whose activate runs a real enable().
  app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'max-age=3600')
    res.type('application/javascript').sendFile(path.join(e2ePath, 'static', 'framebusting', 'sw.js'))
  })

  app.get('/probe', (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Cache-Control', 'no-store')
    res.send('probe')
  })
}

describe('e2e browser network navigation preload in an out-of-process AUT', () => {
  systemTests.setup({
    servers: [{
      port: 4477,
      onServer: onSwServer,
    }],
  })

  // Cypress launches Chrome with --disable-site-isolation-trials, which turns
  // off site-per-process, so an ordinary cross-site AUT shares the top
  // renderer and never produces a separate target. Isolating just the fixture
  // origin is the narrowest way to get the out-of-process frame this test is
  // about, and it leaves every other origin in the run alone.
  systemTests.it('disables navigation preload in an out-of-process AUT [browser network]', {
    browser: 'chrome',
    spec: 'oopif_navigation_preload.cy.js',
    expectedExitCode: 0,
    processEnv: {
      CHROMIUM_EXTRA_LAUNCH_ARGS: '--isolate-origins=http://127.0.0.1:4477',
    },
    config: {
      forceHttp1: false,
      pageLoadTimeout: 15000,
    },
  })
})
