const activate = async () => {
  self.clients.claim()
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
        '/cached-sw',
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
