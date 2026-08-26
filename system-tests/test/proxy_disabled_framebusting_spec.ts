import systemTests from '../lib/system-tests'

// #34652: on the browser network (CDP Fetch) path - the default for Chrome/
// Chromium/Edge, see isBrowserNetworkMode in network-mode.ts - CDP Fetch
// interception never sees a service worker's navigation preload request - it
// goes straight to the origin. The renderer's document therefore keeps its raw
// framebusting headers (X-Frame-Options / CSP frame-ancestors) and skips
// Cypress's document injection, so the AUT iframe refuses to load. Plain SW
// `fetch(e.request)` passthrough is intercepted fine (that's #34566); only the
// preload request escapes - this affects sites that serve documents through a
// navigation-preload service worker (as the reported amazon.com / youtube.com
// repros do). With forceHttp1 (the deprecated HTTP/1 MITM proxy path), the
// preload request traverses the MITM proxy and gets stripped there instead, so
// the same page loads. The remediation disables navigation preload on the
// browser network path - via a script prepended to the service worker itself
// (worker realm) plus a page bootstrap script evaluated on every new document
// (window realm), see disable-navigation-preload.ts - so the SW's fetch
// handler falls back to fetch(e.request), which IS intercepted.
//
// This spec asserts the remediation mechanism directly rather than the
// original SW-served-navigation framebusting repro: in the live browser, both
// realms' navigationPreload.enable() calls settle (sw-ready implies this) and
// navigationPreload.getState().enabled ends up false on the browser network
// path (both seams no-op'd it) and true under forceHttp1 (both seams are
// inert on MITM, so the SW's real enable() call sticks). What is deliberately
// NOT asserted here is a worker-served return navigation rendering
// unbusted - on CI containers Chrome culls this fixture's worker within
// ~200ms of first use (ordinary renderer teardown on navigation, not a
// crash event) and the cold-started replacement can serve navigations for
// as long as ~3s before Target.attachedToTarget is delivered on either CDP
// connection. CDP offers no pre-execution hook for a target, so no
// coordination scheme can close that gap - it is the irreducible remainder
// of #34674 (the product-side holds landed there cover every case CDP
// actually notifies on). #34674 carries the navigation-level regression
// recipe to restore once that gap is closed some other way.
//
// Both realms that can call navigationPreload.enable() are exercised here,
// each guarding its own seam (see disable-navigation-preload.ts): this
// worker-realm call guards the injector's script-prepend seam, and the
// page-side call in the pageSource script below guards the window-realm
// bootstrap-script seam. Deleting either seam re-enables real preload and
// turns the [browser network] variant red.
const swSource = `
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Order is load-bearing: claim() (which gates the page's sw-ready flag via
    // .controller) only runs after enable() settles, so the forceHttp1 control
    // is guaranteed to have preload active before the spec's assertion reads
    // getState(). On the browser network path, Cypress patches enable() to a
    // resolving no-op — activation completing at all is part of what this
    // test proves.
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
  } else if (new URL(e.request.url).pathname === '/probe') {
    // Passthrough for the page's readiness probe (see pageSource): lets the
    // page observe whether worker-originated fetches are intercepted yet.
    e.respondWith(fetch(e.request))
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

// Poll .controller AND pageEnableSettled rather than navigationPreload.getState()
// here: on the browser network path Cypress no-ops both enable() calls, so
// getState().enabled never becomes true, and this poll is what the spec's own
// getState() assertion waits on. Order is load-bearing on both sides the same
// way: claim() (which gates .controller) only runs after the worker-realm
// enable() settles, and pageEnableSettled only flips after the window-realm
// enable() above settles - each guarantees its own seam had a chance to run
// before the getState() readout.
//
// The /probe poll can't prevent an injector miss - by the time this page
// script runs, a worker that cold-started before the injector's script-prepend
// seam attached has already made its real enable() call (the #34674 gap this
// spec's header disclaims). Its value is diagnostic rather than corrective: a
// worker whose session interception is stuck or never covered surfaces here as
// a clear sw-ready timeout instead of a confusing getState() assertion
// failure, and it keeps the SW-session interception path (Fetch enabled on
// the worker's own CDP session) live-exercised by this spec. The probe is
// passed through the worker (see swSource) and the origin serves it with
// X-Frame-Options, which interception always strips: the header disappearing
// from a same-origin fetch is evidence that worker-originated traffic is
// intercepted.
const check = () => {
  if (!navigator.serviceWorker.controller || !pageEnableSettled) {
    return setTimeout(check, 50)
  }

  fetch('/probe').then((res) => {
    if (res.headers.get('x-frame-options')) {
      return setTimeout(check, 250)
    }

    document.getElementById('app').textContent = 'sw-ready'
  }, () => setTimeout(check, 250))
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
    res.type('application/javascript').send(swSource)
  })

  // Readiness probe (see pageSource): served with a framebusting header that
  // interception strips, so its presence in the page's fetch response means
  // worker-originated traffic is not intercepted yet.
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
      },
    },
  })
})
