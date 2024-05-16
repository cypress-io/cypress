const activate = async () => {
  await self.clients.claim()
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable()
  }
}

self.addEventListener('activate', (event) => {
  event.waitUntil(activate())
})

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open('v1').then(function (cache) {
      return cache.addAll([
        '/cypress/fixtures/service-worker-assets/scope/cached-service-worker.json',
      ])
    }),
  )
})

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request)
    }),
  )
})
