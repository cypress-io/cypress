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
// there instead, so the same page loads. The remediation disables navigation
// preload when the proxy is disabled - via a script prepended to the service
// worker itself (worker realm) plus a page bootstrap script evaluated on every
// new document (window realm), see disable-navigation-preload.ts - so the SW's
// fetch handler falls back to fetch(e.request), which IS intercepted. The
// [proxy disabled] variant here guards that behavior, while the [proxy enabled]
// control keeps exercising real preload through the MITM.
//
// The AUT iframe's first visit is a real navigation, but its response is served
// from Cypress's server-side resolve:url buffer, and no service worker controls
// the client yet at that point. Service worker registrations are cleared between
// specs (not between tests within a spec), so the repro needs a single test that
// registers the SW, then navigates away and back so the return visit's document
// request is the one served through the SW's (now-active) navigation preload.
// Both realms that can call navigationPreload.enable() are exercised here,
// each guarding its own seam (see disable-navigation-preload.ts): this
// worker-realm call guards the injector's script-prepend seam, and the
// page-side call in the pageSource script below guards the window-realm
// bootstrap-script seam. Deleting either seam re-enables real preload and
// turns the [proxy disabled] variant red.
const swSource = `
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Order is load-bearing: claim() (which gates the page's sw-ready flag via
    // .controller) only runs after enable() settles, so the proxy-enabled
    // control is guaranteed to have preload active before the spec bounces.
    // Under proxy-disabled, Cypress patches enable() to a resolving no-op —
    // activation completing at all is part of what this test proves.
    await self.registration.navigationPreload.enable()
    await self.clients.claim()
  })())
})
self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const preload = await e.preloadResponse

      if (preload) return preload

      return fetch(e.request)
    })())
  }
})
`

const pageSource = `
<html><body><h1 id="app">app</h1><script>
navigator.serviceWorker.register('/sw.js')

// Window-realm call guarding the bootstrap-script seam (see swSource's
// comment above). \`reg\` here is the worker's own registration, reached
// from the window via \`serviceWorker.ready\` - but which seam a call
// exercises depends on which realm's NavigationPreloadManager.prototype it
// resolves through, not on which object it was reached from: called from
// here, it resolves through the window realm's prototype (the one the
// bootstrap script patches), not the worker's own.
let pageEnableSettled = false
const markPageEnableSettled = () => { pageEnableSettled = true }

navigator.serviceWorker.ready
  .then((reg) => reg.navigationPreload.enable())
  .then(markPageEnableSettled, markPageEnableSettled)

// Poll .controller AND pageEnableSettled rather than navigationPreload.getState():
// under proxy-disabled Cypress no-ops both enable() calls, so getState().enabled
// never becomes true. Order is load-bearing on both sides the same way: claim()
// (which gates .controller) only runs after the worker-realm enable() settles, and
// pageEnableSettled only flips after the window-realm enable() above settles -
// each guarantees its own seam had a chance to run before the return visit.
const check = () => {
  if (navigator.serviceWorker.controller && pageEnableSettled) {
    document.getElementById('app').textContent = 'sw-ready'
  } else {
    setTimeout(check, 50)
  }
}

check()
</script></body></html>
`

const onSwServer = function (app) {
  app.get('/', (req, res) => {
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Content-Security-Policy', 'frame-ancestors \'none\'')
    res.setHeader('Cache-Control', 'no-store')
    res.send(pageSource)
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
    config: {
      pageLoadTimeout: 15000,
    },
  })
})
