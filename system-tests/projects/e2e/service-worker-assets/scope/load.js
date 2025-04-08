navigator.serviceWorker?.register('/service-worker-assets/scope/service-worker.js')

navigator.serviceWorker?.ready.then(async () => {
  const exampleResponse = await fetch('/service-worker-assets/example.json')
  const example = await exampleResponse.json()
  const cachedServiceWorkerResults = await fetch('/service-worker-assets/scope/cached-service-worker')
  const cached = await cachedServiceWorkerResults.text()

  window.dispatchEvent(new CustomEvent('service-worker:ready', {
    detail: {
      example,
      cached,
    },
  }))
})
