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
  if (new URL(e.request.url).pathname.startsWith('/__/assets/e2e-poison')) {
    // Poison marker under Cypress's reserved client route. An app worker is
    // otherwise entitled to answer for this path, so the marker coming back is
    // proof the injected wrapper let the app handler run for a runner-namespace
    // request.
    e.respondWith(new Response('SW-POISON', { headers: { 'content-type': 'text/plain' } }))

    return
  }

  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      const preload = await e.preloadResponse

      if (preload) return preload

      return fetch(e.request)
    })())
  } else if (new URL(e.request.url).pathname === '/probe') {
    // Passthrough for the page's readiness probe (see index.html): lets the
    // page observe whether worker-originated fetches are intercepted yet.
    e.respondWith(fetch(e.request))
  }
})
