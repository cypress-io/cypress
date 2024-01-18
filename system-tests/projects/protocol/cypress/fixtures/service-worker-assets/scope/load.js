navigator.serviceWorker?.register(new URL('http://localhost:2121/cypress/fixtures/service-worker-assets/scope/service-worker.js'))

navigator.serviceWorker?.ready.then(async () => {
  const exampleResponse = await fetch('/cypress/fixtures/service-worker-assets/example.json')
  const example = await exampleResponse.json()
  const cachedResponse = await fetch('/cypress/fixtures/service-worker-assets/scope/cached-service-worker.json')
  const cached = await cachedResponse.json()

  window.dispatchEvent(new CustomEvent('service-worker:ready', {
    detail: {
      example,
      cached,
    },
  }))
})
