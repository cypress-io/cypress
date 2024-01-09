navigator.serviceWorker?.register('/service-worker-assets/scope/service-worker.js')

navigator.serviceWorker?.ready.then(async () => {
  await fetch('/service-worker-assets/example.json')
  await fetch('/service-worker-assets/scope/cached-service-worker')

  window.dispatchEvent(new Event('service-worker:ready'))
})
