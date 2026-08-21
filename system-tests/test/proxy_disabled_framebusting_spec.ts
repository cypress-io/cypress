import systemTests from '../lib/system-tests'

// #34652: with the proxy disabled, CDP Fetch interception (Chromium-only) never
// sees a service worker's navigation preload request - it goes straight to the
// origin. The renderer's document therefore keeps its raw framebusting headers
// (X-Frame-Options / CSP frame-ancestors) and skips Cypress's document
// injection, so the AUT iframe refuses to load. Plain SW `fetch(e.request)`
// passthrough is intercepted fine (that's #34566); only the preload request
// escapes - this affects sites that serve documents through a navigation-preload
// service worker (as the reported amazon.com / youtube.com repros do). With the
// proxy enabled, the preload request traverses the MITM proxy and gets stripped
// there instead, so the same page loads.
//
// The AUT iframe's first visit is a real navigation, but its response is served
// from Cypress's server-side resolve:url buffer, and no service worker controls
// the client yet at that point. Service worker registrations are cleared between
// specs (not between tests within a spec), so the repro needs a single test that
// registers the SW, then navigates away and back so the return visit's document
// request is the one served through the SW's (now-active) navigation preload.
const swSource = `
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    await self.registration.navigationPreload.enable()
    await self.clients.claim()
  })())
})
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const preload = await e.preloadResponse

      if (preload) return preload

      return new Response('<html><body><h1 id="app">no-preload</h1></body></html>', {
        headers: { 'content-type': 'text/html' },
      })
    })())
  }
})
`

const onSwServer = function (app) {
  app.get('/', (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'')
    res.setHeader('Cache-Control', 'no-store')
    // `serviceWorker.ready` can resolve while the worker is still activating
    // (before navigationPreload.enable() settles in the activate handler's
    // waitUntil), so poll getState() until preload is actually enabled
    res.send('<html><body><h1 id="app">app</h1><script>navigator.serviceWorker.register(\'/sw.js\'); const check = () => { navigator.serviceWorker.ready.then((reg) => reg.navigationPreload.getState()).then((state) => { if (state.enabled) { document.getElementById(\'app\').textContent = \'sw-ready\' } else { setTimeout(check, 50) } }) }; check()</script></body></html>')
  })

  app.get('/sw.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.type('application/javascript').send(swSource)
  })
}

const onOtherServer = function (app) {
  app.get('/', (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    res.send('<html><body><h1 id="other">other</h1></body></html>')
  })
}

describe('e2e proxy disabled framebusting', () => {
  systemTests.setup({
    servers: [{
      port: 4466,
      onServer: onSwServer,
    }, {
      port: 4477,
      onServer: onOtherServer,
    }],
  })

  systemTests.it('neutralizes framebusting protections behind a nav-preload service worker [proxy disabled]', {
    browser: 'chrome',
    spec: 'proxy_disabled_framebusting.cy.js',
    expectedExitCode: 0,
    processEnv: {
      CYPRESS_INTERNAL_DISABLE_PROXY: '1',
    },
    config: {
      pageLoadTimeout: 15000,
    },
  })

  // Explicit '0' so this control stays proxy-enabled even inside the CI cdp job whose
  // shell exports CYPRESS_INTERNAL_DISABLE_PROXY=1; is-proxy-disabled checks strict
  // equality with '1', so a proxy-enabled run has to override it back to '0' here.
  systemTests.it('neutralizes framebusting protections behind a nav-preload service worker [proxy enabled]', {
    browser: 'chrome',
    spec: 'proxy_disabled_framebusting.cy.js',
    expectedExitCode: 0,
    processEnv: {
      CYPRESS_INTERNAL_DISABLE_PROXY: '0',
    },
  })
})
