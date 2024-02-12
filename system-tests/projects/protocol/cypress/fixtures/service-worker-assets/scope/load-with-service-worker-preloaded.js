navigator.serviceWorker?.ready.then(async () => {
  // Wait for the service worker to be ready and deterministically ensure these requests are handled by the service worker
  await new Promise((resolve) => setTimeout(resolve, 500))
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
