navigator.serviceWorker?.register(new URL('http://localhost:2121/cypress/fixtures/service-worker-assets/scope/service-worker.js'))

navigator.serviceWorker?.ready.then(async () => {
  await fetch('/cypress/fixtures/service-worker-assets/example.json')
  await fetch('/cypress/fixtures/service-worker-assets/scope/cached-service-worker.json')

  window.dispatchEvent(new Event('service-worker:ready'))
})
